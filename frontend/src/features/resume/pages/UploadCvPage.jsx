import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '../../../components/layout/PageHeader';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import ErrorMessage from '../../../components/common/ErrorMessage';
import { useResumes } from '../hooks/useResumes';
import { uploadCv } from '../api/uploadApi';
import { mapExtractedToContent } from '../utils/mapExtractedToContent';
import { generateUuid } from '../utils/resumeModel';
import { validateCvFile, formatFileSize } from '../utils/fileValidation';
import ReviewImportedCv from '../components/ReviewImportedCv';
import { fadeSlideUp } from '../../../lib/motion';

// picking -> uploading -> review -> saving -> done
export default function UploadCvPage() {
    const navigate = useNavigate();
    const { saveResume } = useResumes();
    const fileInputRef = useRef(null);

    const [stage, setStage] = useState('picking');
    const [file, setFile] = useState(null);
    const [validationError, setValidationError] = useState('');
    const [uploadError, setUploadError] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    const [draftContent, setDraftContent] = useState(null);
    const [draftTitle, setDraftTitle] = useState('');
    const [lowConfidenceFields, setLowConfidenceFields] = useState([]);
    const [savedResumeId, setSavedResumeId] = useState(null);
    const [saveError, setSaveError] = useState('');
    // { isKnown, templateId, category, other: { id, name, isNew } | null } —
    // see backend/services/templateService.js. Purely informational for
    // "Other" (an imported template is provenance metadata, never a
    // renderer — the saved resume still renders via the 'classic' React
    // template set below, same as any other imported CV).
    const [detectedTemplate, setDetectedTemplate] = useState(null);

    const handleFileSelected = (selected) => {
        setValidationError('');
        setUploadError('');
        const error = validateCvFile(selected);
        if (error) {
            setValidationError(error);
            setFile(null);
            return;
        }
        setFile(selected);
    };

    const handleInputChange = (e) => {
        const selected = e.target.files?.[0];
        if (selected) handleFileSelected(selected);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const dropped = e.dataTransfer.files?.[0];
        if (dropped) handleFileSelected(dropped);
    };

    const handleUpload = async () => {
        if (!file) return;
        setStage('uploading');
        setUploadError('');
        try {
            const result = await uploadCv(file);
            setDraftContent(mapExtractedToContent(result.extracted));
            setDraftTitle(result.suggestedTitle || 'Imported CV');
            setLowConfidenceFields(result.lowConfidenceFields || []);
            setDetectedTemplate(result.template || null);
            setStage('review');
        } catch (err) {
            setUploadError(err.message || 'CV upload failed. Please try again.');
            setStage('picking');
        }
    };

    const handleCancelReview = () => {
        setStage('picking');
        setFile(null);
        setDraftContent(null);
        setDraftTitle('');
        setLowConfidenceFields([]);
        setDetectedTemplate(null);
    };

    const handleConfirmImport = async () => {
        setStage('saving');
        setSaveError('');
        try {
            const resume = {
                id: generateUuid(),
                title: draftTitle.trim(),
                templateId: 'classic',
                themeColor: '#4F46E5',
                updatedAt: new Date().toISOString(),
                content: draftContent,
                // Provenance only when this was detected as an "Other"
                // template — never affects which React component renders
                // this resume (always 'classic' above, since that's the
                // only thing that actually exists to render it).
                importedTemplateId: detectedTemplate?.category === 'other' ? detectedTemplate.other?.id : undefined,
            };
            const saved = await saveResume(resume);
            setSavedResumeId(saved.id);
            setStage('done');
        } catch (err) {
            setSaveError(err.message || 'Failed to save the imported resume. Please try again.');
            setStage('review');
        }
    };

    const resetAll = () => {
        setStage('picking');
        setFile(null);
        setValidationError('');
        setUploadError('');
        setDraftContent(null);
        setDraftTitle('');
        setLowConfidenceFields([]);
        setSavedResumeId(null);
        setSaveError('');
        setDetectedTemplate(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    if (stage === 'review' || stage === 'saving') {
        return (
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
                {saveError && <ErrorMessage message={saveError} className="mb-4" />}
                {detectedTemplate && (
                    <div className="mb-4 flex items-center gap-2 text-xs font-medium text-text-secondary bg-bg-main border border-border rounded-md px-3 py-2 w-fit">
                        <span className="material-symbols-outlined text-[16px] text-primary">
                            {detectedTemplate.category === 'built-in' ? 'verified' : 'description'}
                        </span>
                        {detectedTemplate.category === 'built-in'
                            ? `Detected: previously exported with this app's "${detectedTemplate.templateId}" template`
                            : 'Design not recognized — filed under "Other" in Templates'}
                    </div>
                )}
                <ReviewImportedCv
                    content={draftContent}
                    onChange={setDraftContent}
                    title={draftTitle}
                    onTitleChange={setDraftTitle}
                    lowConfidenceFields={lowConfidenceFields}
                    onConfirm={handleConfirmImport}
                    onCancel={handleCancelReview}
                    isSaving={stage === 'saving'}
                />
            </div>
        );
    }

    if (stage === 'done') {
        return (
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
                <motion.div variants={fadeSlideUp} initial="hidden" animate="show">
                    <Card className="text-center py-10">
                        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-[32px] text-success">check_circle</span>
                        </div>
                        <h2 className="text-xl font-bold text-text-primary mb-2">CV imported successfully</h2>
                        <p className="text-sm text-text-secondary max-w-md mx-auto mb-6">
                            "{draftTitle}" has been added to My Resumes. You can keep editing it in Resume Studio or
                            check it against a job description right away.
                        </p>
                        <div className="flex items-center justify-center gap-3 flex-wrap">
                            <Button variant="outline" onClick={() => navigate('/my-resumes')}>
                                Go to My Resumes
                            </Button>
                            <Button variant="secondary" onClick={() => navigate(`/resume-studio/${savedResumeId}`)}>
                                Open in Resume Studio
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => navigate('/ats-checker', { state: { resumeId: savedResumeId } })}
                                leftIcon={<span className="material-symbols-outlined text-[18px]">fact_check</span>}
                            >
                                Check ATS Score
                            </Button>
                        </div>
                    </Card>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
            <PageHeader
                title="Upload CV"
                description="Import an existing resume from your computer — we'll extract the details so you can review them before anything is saved."
            />

            <Card>
                <div
                    onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        isDragging ? 'border-primary bg-soft-primary' : 'border-border bg-bg-main'
                    }`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={handleInputChange}
                        className="hidden"
                        id="cv-file-input"
                    />

                    <span className="material-symbols-outlined text-[40px] text-primary/70 mb-2 block">
                        upload_file
                    </span>

                    {!file ? (
                        <>
                            <p className="text-sm text-text-primary font-medium mb-1">
                                Drag and drop your CV here, or
                            </p>
                            <label htmlFor="cv-file-input">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    Choose File
                                </Button>
                            </label>
                            <p className="text-xs text-text-secondary mt-3">
                                Supports .pdf and .docx — up to 5MB.
                            </p>
                        </>
                    ) : (
                        <div className="flex items-center justify-center gap-3">
                            <span className="material-symbols-outlined text-[24px] text-text-secondary">
                                description
                            </span>
                            <div className="text-left">
                                <p className="text-sm font-medium text-text-primary truncate max-w-xs">
                                    {file.name}
                                </p>
                                <p className="text-xs text-text-secondary">{formatFileSize(file.size)}</p>
                            </div>
                            <button
                                type="button"
                                onClick={resetAll}
                                aria-label="Remove file"
                                className="p-1.5 rounded-md text-text-secondary hover:text-error hover:bg-error/10 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>
                    )}
                </div>

                <AnimatePresence>
                    {validationError && <ErrorMessage message={validationError} className="mt-4" />}
                    {uploadError && <ErrorMessage message={uploadError} className="mt-4" />}
                </AnimatePresence>

                {stage === 'uploading' && (
                    <div className="mt-4 flex items-center gap-3 text-sm text-text-secondary bg-soft-primary/50 rounded-lg p-3">
                        <svg className="animate-spin h-4 w-4 text-primary shrink-0" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        Reading your CV and extracting details — this can take up to 30 seconds…
                    </div>
                )}

                <div className="flex justify-end mt-6">
                    <Button
                        type="button"
                        variant="primary"
                        onClick={handleUpload}
                        disabled={!file}
                        isLoading={stage === 'uploading'}
                    >
                        {stage === 'uploading' ? 'Extracting…' : 'Upload & Extract'}
                    </Button>
                </div>
            </Card>
        </div>
    );
}
