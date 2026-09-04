import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Loader from '../../../components/feedback/Loader';
import ErrorMessage from '../../../components/common/ErrorMessage';
import { improveResume } from '../../ats/api/atsApi';

const CHANGE_TYPE_LABELS = {
    'keyword-alignment': 'Keyword alignment',
    clarity: 'Clarity',
    relevance: 'Relevance',
    'achievement-framing': 'Achievement framing',
    'action-verb': 'Action verb improvement',
    'technical-terminology': 'Technical terminology',
    'summary-alignment': 'Summary alignment',
    'skill-alignment': 'Skill alignment',
};

function confidenceTone(confidence) {
    if (confidence >= 80) return 'text-success';
    if (confidence >= 40) return 'text-warning';
    return 'text-error';
}

/**
 * Finds the metadata (reason/jdRequirement/changeTypes/confidence) for one
 * diffed change from the flat `changes` list the backend returns. Matches
 * by type+targetId, taking the LAST match (mirrors apply_proposal's
 * last-write-wins across iterations). A brand-new skills group has no
 * targetId at proposal time (the id is only generated once applied), so it
 * matches by category name instead.
 */
function findChangeMeta(proposalChanges, change) {
    if (!proposalChanges) return null;
    const matches = proposalChanges.filter((c) => {
        if (change.type === 'summary') return c.type === 'summary';
        if (change.type === 'experience') return c.type === 'experience' && c.targetId === change.targetId;
        if (change.type === 'skills-add') return c.type === 'skills' && c.targetId === change.targetId;
        if (change.type === 'skills-new') return c.type === 'skills' && c.targetId === '' && c.category === change.category;
        return false;
    });
    return matches.length > 0 ? matches[matches.length - 1].meta : null;
}

/**
 * Diffs the original resume content against the AI-proposed content,
 * producing one entry per field that actually changed. Deliberately only
 * looks at the three kinds of edits the backend's apply_proposal() can ever
 * produce (personal.summary, experience[].description, skills[].items) —
 * every other field is structurally guaranteed untouched. `proposalChanges`
 * (from the API's `changes` array) is attached as `.meta` per entry so the
 * UI can show why/JD-requirement/change-type/confidence alongside the diff.
 *
 * @returns {Array<{id: string, type: string, label: string, before: any, after: any, targetId?: string, category?: string, meta: object|null}>}
 */
function computeDiff(original, proposed, proposalChanges) {
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

    return changes.map((c) => ({ ...c, meta: findChangeMeta(proposalChanges, c) }));
}

/**
 * Applies only the selected changes onto a fresh deep-clone of the full
 * resume document. `editedText` maps a change id -> user-edited override
 * text (Edit action) for text-type changes (summary/experience); when
 * present it's used instead of the AI-proposed `after` text, but it's
 * still only ever written to the same 3 code-enforced fields as before —
 * editing never widens what a change is allowed to touch.
 */
function applySelectedChanges(resume, changes, selectedIds, editedText = {}) {
    const next = structuredClone(resume);
    for (const change of changes) {
        if (!selectedIds.has(change.id)) continue;
        const override = editedText[change.id];
        if (change.type === 'summary') {
            next.content.personal.summary = override ?? change.after;
        } else if (change.type === 'experience') {
            const item = next.content.experience.find((e) => e.id === change.targetId);
            if (item) item.description = override ?? change.after;
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

const TEXT_CHANGE_TYPES = new Set(['summary', 'experience']);

function ChangeCard({ change, state, onStateChange, editedValue, onEditedValueChange }) {
    const isEditable = TEXT_CHANGE_TYPES.has(change.type);
    const meta = change.meta;

    return (
        <div className="p-4 rounded-lg border border-border bg-bg-main space-y-3">
            <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-text-primary">{change.label}</p>
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        type="button"
                        onClick={() => onStateChange('accepted')}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${state === 'accepted' ? 'bg-success/15 text-success' : 'text-text-secondary hover:bg-bg-card'}`}
                    >
                        Accept
                    </button>
                    {isEditable && (
                        <button
                            type="button"
                            onClick={() => onStateChange('editing')}
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${state === 'editing' ? 'bg-primary/15 text-primary' : 'text-text-secondary hover:bg-bg-card'}`}
                        >
                            Edit
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => onStateChange('rejected')}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${state === 'rejected' ? 'bg-error/15 text-error' : 'text-text-secondary hover:bg-bg-card'}`}
                    >
                        Reject
                    </button>
                </div>
            </div>

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
                        {state === 'editing' ? (
                            <textarea
                                value={editedValue ?? change.after}
                                onChange={(e) => onEditedValueChange(e.target.value)}
                                rows={4}
                                className="w-full text-text-primary bg-card rounded-md p-2.5 border border-primary/40 focus:border-primary focus:outline-none whitespace-pre-wrap text-sm"
                            />
                        ) : (
                            <p className="text-text-primary bg-success/5 rounded-md p-2.5 border border-success/30 whitespace-pre-wrap">
                                {editedValue ?? change.after}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {meta && (
                <div className="pt-3 border-t border-border space-y-2 text-sm">
                    <p className="text-text-secondary"><span className="font-semibold text-text-primary">Why: </span>{meta.reason}</p>
                    <div className="flex flex-wrap items-center gap-2">
                        {meta.jdRequirement && (
                            <span className="text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                Matches: {meta.jdRequirement}
                            </span>
                        )}
                        {meta.changeTypes?.map((t) => (
                            <Badge key={t} variant="neutral" size="sm">{CHANGE_TYPE_LABELS[t] || t}</Badge>
                        ))}
                        <span className={`text-xs font-semibold ml-auto ${confidenceTone(meta.confidence)}`}>
                            {meta.confidence}% confidence
                        </span>
                    </div>
                </div>
            )}
        </div>
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
    // Per-change id -> 'accepted' | 'rejected' | 'editing'. Starts fully
    // accepted (matches the prior "all pre-selected" behavior) so a user
    // who wants everything can just hit Apply immediately.
    const [changeStates, setChangeStates] = useState({});
    const [editedText, setEditedText] = useState({});

    useEffect(() => {
        let cancelled = false;
        setStatus('loading');
        setError('');
        setImproveResult(null);
        setChanges([]);

        improveResume({ resumeId, jobDescription, currentAnalysis })
            .then((data) => {
                if (cancelled) return;
                const diff = computeDiff(resume.content, data.proposedContent, data.changes);
                setImproveResult(data);
                setChanges(diff);
                setChangeStates(Object.fromEntries(diff.map((c) => [c.id, 'accepted'])));
                setEditedText({});
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

    const setChangeState = (id, next) => {
        setChangeStates((prev) => ({ ...prev, [id]: next }));
    };

    const acceptedCount = changes.filter((c) => changeStates[c.id] === 'accepted' || changeStates[c.id] === 'editing').length;
    const rejectedCount = changes.filter((c) => changeStates[c.id] === 'rejected').length;
    const pendingCount = changes.length - acceptedCount - rejectedCount;

    const toggleAll = () => {
        const allAccepted = changes.every((c) => changeStates[c.id] === 'accepted' || changeStates[c.id] === 'editing');
        setChangeStates(Object.fromEntries(changes.map((c) => [c.id, allAccepted ? 'rejected' : 'accepted'])));
    };

    // A change is "selected" (applied) unless explicitly rejected — editing
    // still counts as accepted, using the edited text instead of the
    // AI-proposed one.
    const selectedIds = new Set(changes.filter((c) => changeStates[c.id] !== 'rejected').map((c) => c.id));

    const handleApply = async () => {
        if (selectedIds.size === 0) {
            navigate('/my-resumes');
            return;
        }
        setStatus('applying');
        setError('');
        try {
            const updated = applySelectedChanges(resume, changes, selectedIds, editedText);
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
                                    Projected score — if all suggestions are applied
                                </p>
                                <p className="text-sm text-text-secondary mt-0.5">
                                    Based on {improveResult.iterations} improvement round
                                    {improveResult.iterations === 1 ? '' : 's'} with every suggestion accepted —
                                    not a live number for your current selection below. Run "Check Again" on the
                                    ATS Checker after saving to get a real recalculated score for what you
                                    actually applied.
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

                        {changes.length > 0 && status !== 'applied' && (
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
                                <span className="font-semibold text-text-primary">Tailoring summary</span>
                                <span>{changes.length} suggestion{changes.length === 1 ? '' : 's'}</span>
                                <span className="text-success">{acceptedCount} accepted</span>
                                <span className="text-error">{rejectedCount} rejected</span>
                                {pendingCount > 0 && <span>{pendingCount} pending</span>}
                            </div>
                        )}

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
                                        {selectedIds.size === changes.length ? 'Reject all' : 'Accept all'}
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {changes.map((change) => (
                                        <ChangeCard
                                            key={change.id}
                                            change={change}
                                            state={changeStates[change.id]}
                                            onStateChange={(next) => setChangeState(change.id, next)}
                                            editedValue={editedText[change.id]}
                                            onEditedValueChange={(text) =>
                                                setEditedText((prev) => ({ ...prev, [change.id]: text }))
                                            }
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
