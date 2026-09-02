import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/common/Button';
import Loader from '../../../components/feedback/Loader';
import ErrorMessage from '../../../components/common/ErrorMessage';
import { improveResume } from '../../ats/api/atsApi';

/**
 * Diffs the original resume content against the AI-proposed content,
 * producing one entry per field that actually changed. Deliberately only
 * looks at the three kinds of edits the backend's apply_proposal() can ever
 * produce (personal.summary, experience[].description, skills[].items) —
 * every other field is structurally guaranteed untouched.
 *
 * @returns {Array<{id: string, type: string, label: string, before: any, after: any, targetId?: string, category?: string}>}
 */
function computeDiff(original, proposed) {
    const changes = [];

    if ((original.personal?.summary || '') !== (proposed.personal?.summary || '')) {
        changes.push({
            id: 'summary',
            type: 'summary',
            label: 'Professional Summary',
            before: original.personal?.summary || '',
            after: proposed.personal?.summary || '',
        });
    }

    const origExpById = Object.fromEntries((original.experience || []).map((e) => [e.id, e]));
    for (const exp of proposed.experience || []) {
        const orig = origExpById[exp.id];
        if (orig && orig.description !== exp.description) {
            changes.push({
                id: `exp-${exp.id}`,
                type: 'experience',
                label: `${orig.role || 'Role'}${orig.company ? ` @ ${orig.company}` : ''}`,
                before: orig.description || '',
                after: exp.description || '',
                targetId: exp.id,
            });
        }
    }

    const origSkillById = Object.fromEntries((original.skills || []).map((g) => [g.id, g]));
    for (const group of proposed.skills || []) {
        const orig = origSkillById[group.id];
        if (!orig) {
            if (group.items?.length > 0) {
                changes.push({
                    id: `skillnew-${group.id}`,
                    type: 'skills-new',
                    label: `New skill group — ${group.category}`,
                    before: [],
                    after: group.items,
                    targetId: group.id,
                    category: group.category,
                });
            }
            continue;
        }
        const addedItems = (group.items || []).filter((item) => !(orig.items || []).includes(item));
        if (addedItems.length > 0) {
            changes.push({
                id: `skill-${group.id}`,
                type: 'skills-add',
                label: `Skills — ${orig.category}`,
                before: orig.items || [],
                after: group.items || [],
                addedItems,
                targetId: group.id,
            });
        }
    }

    return changes;
}

/** Applies only the selected changes onto a fresh deep-clone of the full resume document. */
function applySelectedChanges(resume, changes, selectedIds) {
    const next = structuredClone(resume);
    for (const change of changes) {
        if (!selectedIds.has(change.id)) continue;
        if (change.type === 'summary') {
            next.content.personal.summary = change.after;
        } else if (change.type === 'experience') {
            const item = next.content.experience.find((e) => e.id === change.targetId);
            if (item) item.description = change.after;
        } else if (change.type === 'skills-add') {
            const group = next.content.skills.find((g) => g.id === change.targetId);
            if (group) group.items = change.after;
        } else if (change.type === 'skills-new') {
            next.content.skills.push({ id: change.targetId, category: change.category, items: change.after });
        }
    }
    return next;
}

function scoreTone(score) {
    if (score >= 75) return 'text-success';
    if (score >= 45) return 'text-warning';
    return 'text-error';
}

function ChangeCard({ change, checked, onToggle }) {
    return (
        <label className="flex items-start gap-3 p-4 rounded-lg border border-border bg-bg-main cursor-pointer">
            <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(change.id)}
                className="mt-1 rounded border-border text-primary focus:ring-primary/30"
            />
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text-primary mb-2">{change.label}</p>
                {change.type === 'skills-new' || change.type === 'skills-add' ? (
                    <div className="space-y-1.5 text-sm">
                        {change.type === 'skills-add' && (
                            <p className="text-text-secondary">
                                Adding: <span className="font-medium text-text-primary">{change.addedItems.join(', ')}</span>
                            </p>
                        )}
                        {change.type === 'skills-new' && (
                            <p className="text-text-secondary">
                                New group with: <span className="font-medium text-text-primary">{change.after.join(', ')}</span>
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-text-secondary mb-1">Before</p>
                            <p className="text-text-secondary bg-bg-main rounded-md p-2.5 border border-border whitespace-pre-wrap">
                                {change.before || <span className="italic">(empty)</span>}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-success mb-1">After</p>
                            <p className="text-text-primary bg-success/5 rounded-md p-2.5 border border-success/30 whitespace-pre-wrap">
                                {change.after}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </label>
    );
}

/**
 * Full-page version of the "Improve This Resume" flow — lives on the AI
 * Tailoring page instead of a modal on the ATS Checker, since that's where
 * a user would actually expect to find AI-driven resume tailoring. Starts
 * the Gemini improve+rescore run automatically on mount (the ATS Checker
 * page already gated the button that got the user here on having a
 * resume/job description/current score to work with).
 *
 * @param {{
 *   resumeId: string,
 *   resume: import('../../resume/utils/resumeModel').ResumeDocument,
 *   jobDescription: string,
 *   currentAnalysis: object,
 *   saveResume: (resume: object) => Promise<object>,
 *   onUsed?: () => void,
 * }} props
 */
export default function ImproveResumeFlow({ resumeId, resume, jobDescription, currentAnalysis, saveResume, onUsed }) {
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading'); // loading | ready | error | applying | applied
    const [error, setError] = useState('');
    const [improveResult, setImproveResult] = useState(null);
    const [changes, setChanges] = useState([]);
    const [selectedIds, setSelectedIds] = useState(new Set());

    useEffect(() => {
        let cancelled = false;
        setStatus('loading');
        setError('');
        setImproveResult(null);
        setChanges([]);

        improveResume({ resumeId, jobDescription, currentAnalysis })
            .then((data) => {
                if (cancelled) return;
                const diff = computeDiff(resume.content, data.proposedContent);
                setImproveResult(data);
                setChanges(diff);
                setSelectedIds(new Set(diff.map((c) => c.id)));
                setStatus('ready');
                onUsed?.();
            })
            .catch((err) => {
                if (cancelled) return;
                if (err.code === 'ATS_SERVICE_UNAVAILABLE') {
                    setError('The ATS analysis service is currently unavailable. Please try again shortly.');
                } else {
                    setError(err.message || 'Failed to generate suggestions.');
                }
                setStatus('error');
            });

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resumeId]);

    const toggleChange = (id) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        setSelectedIds((prev) => (prev.size === changes.length ? new Set() : new Set(changes.map((c) => c.id))));
    };

    const handleApply = async () => {
        if (selectedIds.size === 0) {
            navigate('/my-resumes');
            return;
        }
        setStatus('applying');
        setError('');
        try {
            const updated = applySelectedChanges(resume, changes, selectedIds);
            await saveResume(updated);
            setStatus('applied');
        } catch (err) {
            setError(err.message || 'Failed to save the accepted changes.');
            setStatus('ready');
        }
    };

    return (
        <div className="bg-card border border-border rounded-xl shadow-sm">
            <div className="flex items-center justify-between p-5 border-b border-border">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
                    <h2 className="text-base font-semibold text-text-primary">Improve This Resume</h2>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => navigate('/ats-checker')}>
                    Back to ATS Checker
                </Button>
            </div>

            <div className="p-5 space-y-4">
                {status === 'loading' && (
                    <div className="py-10">
                        <Loader message="Generating truthful improvement suggestions and re-scoring — this can take up to a minute..." />
                    </div>
                )}

                {status === 'error' && <ErrorMessage message={error} />}

                {(status === 'ready' || status === 'applying' || status === 'applied') && improveResult && (
                    <>
                        <div className="bg-soft-primary border border-primary/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                    Projected score
                                </p>
                                <p className="text-sm text-text-secondary mt-0.5">
                                    Based on {improveResult.iterations} improvement round
                                    {improveResult.iterations === 1 ? '' : 's'} — a re-run of the same scoring
                                    on the draft below, not a guaranteed real-world outcome.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-lg font-bold text-text-secondary">{improveResult.initialScore}%</span>
                                <span className="material-symbols-outlined text-text-secondary text-[18px]">arrow_forward</span>
                                <span className={`text-2xl font-extrabold ${scoreTone(improveResult.finalScore)}`}>
                                    {improveResult.finalScore}%
                                </span>
                            </div>
                        </div>

                        {improveResult.changeNotes?.length > 0 && (
                            <ul className="text-sm text-text-secondary space-y-1 list-disc list-inside">
                                {improveResult.changeNotes.map((note, i) => (
                                    <li key={i}>{note}</li>
                                ))}
                            </ul>
                        )}

                        {status === 'applied' ? (
                            <div className="flex items-center gap-2 text-success text-sm font-medium py-4">
                                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                                Selected changes saved to your resume.
                            </div>
                        ) : changes.length === 0 ? (
                            <p className="text-sm text-text-secondary py-4">
                                No truthful improvements were found — this resume already represents your
                                background well for this job description.
                            </p>
                        ) : (
                            <>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                        Proposed changes ({selectedIds.size} of {changes.length} selected)
                                    </p>
                                    <button
                                        type="button"
                                        onClick={toggleAll}
                                        className="text-xs font-semibold text-primary hover:underline"
                                    >
                                        {selectedIds.size === changes.length ? 'Deselect all' : 'Select all'}
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {changes.map((change) => (
                                        <ChangeCard
                                            key={change.id}
                                            change={change}
                                            checked={selectedIds.has(change.id)}
                                            onToggle={toggleChange}
                                        />
                                    ))}
                                </div>
                            </>
                        )}

                        {status === 'ready' && error && <ErrorMessage message={error} />}
                    </>
                )}
            </div>

            {(status === 'ready' || status === 'applying') && changes.length > 0 && (
                <div className="flex items-center justify-end gap-2 p-5 border-t border-border">
                    <Button type="button" variant="ghost" onClick={() => navigate('/ats-checker')} disabled={status === 'applying'}>
                        Discard
                    </Button>
                    <Button type="button" variant="primary" onClick={handleApply} isLoading={status === 'applying'}>
                        Apply {selectedIds.size > 0 ? `${selectedIds.size} ` : ''}Selected Change
                        {selectedIds.size === 1 ? '' : 's'}
                    </Button>
                </div>
            )}

            {status === 'applied' && (
                <div className="flex items-center justify-end gap-2 p-5 border-t border-border">
                    <Button type="button" variant="primary" onClick={() => navigate('/my-resumes')}>
                        Done
                    </Button>
                </div>
            )}
        </div>
    );
}
