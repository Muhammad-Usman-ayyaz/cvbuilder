import { useState } from 'react';
import Card from '../../../components/common/Card';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import PersonalInfoForm from './editor/PersonalInfoForm';
import ExperienceForm from './editor/ExperienceForm';
import EducationForm from './editor/EducationForm';
import ProjectsForm from './editor/ProjectsForm';
import SkillsForm from './editor/SkillsForm';
import CertificationsForm from './editor/CertificationsForm';

const LOW_CONFIDENCE_LABELS = {
    fullName: 'Full Name',
    email: 'Email',
    phone: 'Phone',
    location: 'Location',
    linkedin: 'LinkedIn',
    github: 'GitHub',
    portfolio: 'Portfolio',
    summary: 'Professional Summary',
};

/**
 * "Review Your Imported CV" — shown after a CV upload extracts a draft
 * (UploadCvPage.jsx) and before anything is saved. Reuses the exact same
 * section forms as Resume Studio's EditorTabs (PersonalInfoForm,
 * ExperienceForm, etc.) so editing here looks and behaves identically to
 * editing a resume anywhere else in the app — nothing new to learn, and no
 * risk of the review screen's data shape drifting from what Studio expects.
 *
 * Sections render all at once (not as a tabbed wizard like EditorTabs)
 * since the point of this screen is to let the user see everything that
 * was extracted in one pass before committing to it.
 *
 * @param {{
 *   content: import('../utils/resumeModel').ResumeContent,
 *   onChange: (next: import('../utils/resumeModel').ResumeContent) => void,
 *   title: string,
 *   onTitleChange: (next: string) => void,
 *   lowConfidenceFields: string[],
 *   onConfirm: () => void,
 *   onCancel: () => void,
 *   isSaving: boolean,
 * }} props
 */
export default function ReviewImportedCv({
    content,
    onChange,
    title,
    onTitleChange,
    lowConfidenceFields = [],
    onConfirm,
    onCancel,
    isSaving,
}) {
    const [titleError, setTitleError] = useState('');

    const updateField = (field) => (next) => {
        onChange({ ...content, [field]: next });
    };

    const handleConfirm = () => {
        if (!title.trim()) {
            setTitleError('Give this resume a name so you can find it in My Resumes.');
            return;
        }
        onConfirm();
    };

    const lowConfidenceLabels = lowConfidenceFields.map((f) => LOW_CONFIDENCE_LABELS[f] || f);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-text-primary tracking-tight">Review Your Imported CV</h1>
                <p className="text-sm text-text-secondary mt-1 max-w-2xl leading-relaxed">
                    We extracted the information below from your file. Nothing has been saved yet — check it over,
                    fix anything that looks off, then confirm to add it to My Resumes.
                </p>
            </div>

            {lowConfidenceLabels.length > 0 && (
                <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 flex gap-3 text-sm" role="status">
                    <span className="material-symbols-outlined text-[20px] shrink-0 text-warning select-none">
                        info
                    </span>
                    <div>
                        <h5 className="font-semibold text-text-primary">Some fields need a look</h5>
                        <p className="text-text-secondary mt-0.5">
                            We couldn't confidently pull these from your file, so they're blank —{' '}
                            <span className="font-medium text-text-primary">{lowConfidenceLabels.join(', ')}</span>.
                            Fill them in below if needed.
                        </p>
                    </div>
                </div>
            )}

            <Card>
                <Input
                    id="import-resume-title"
                    label="Resume Name"
                    placeholder="e.g. Imported CV — Frontend Developer"
                    value={title}
                    onChange={(e) => {
                        onTitleChange(e.target.value);
                        if (titleError) setTitleError('');
                    }}
                    error={titleError}
                    required
                />
            </Card>

            <Card title="Personal Information">
                <PersonalInfoForm value={content.personal} onChange={updateField('personal')} />
            </Card>

            <Card title="Experience">
                <ExperienceForm value={content.experience} onChange={updateField('experience')} />
            </Card>

            <Card title="Education">
                <EducationForm value={content.education} onChange={updateField('education')} />
            </Card>

            <Card title="Projects">
                <ProjectsForm value={content.projects} onChange={updateField('projects')} />
            </Card>

            <Card title="Skills">
                <SkillsForm value={content.skills} onChange={updateField('skills')} />
            </Card>

            <Card title="Certifications">
                <CertificationsForm value={content.certifications} onChange={updateField('certifications')} />
            </Card>

            <div className="flex items-center justify-end gap-3 pb-6">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>
                    Cancel
                </Button>
                <Button
                    type="button"
                    variant="primary"
                    onClick={handleConfirm}
                    isLoading={isSaving}
                    leftIcon={!isSaving ? <span className="material-symbols-outlined text-[18px]">check</span> : undefined}
                >
                    {isSaving ? 'Importing…' : 'Import CV'}
                </Button>
            </div>
        </div>
    );
}
