import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '../../../components/layout/PageHeader';
import Card from '../../../components/common/Card';
import Select from '../../../components/common/Select';
import TextArea from '../../../components/common/TextArea';
import Button from '../../../components/common/Button';
import ErrorMessage from '../../../components/common/ErrorMessage';
import EmptyState from '../../../components/common/EmptyState';
import Loader from '../../../components/feedback/Loader';
import { useResumes } from '../../resume/hooks/useResumes';
import { uploadCv } from '../../resume/api/uploadApi';
import { mapExtractedToContent } from '../../resume/utils/mapExtractedToContent';
import { generateUuid } from '../../resume/utils/resumeModel';
import { validateCvFile, formatFileSize } from '../../resume/utils/fileValidation';
import { checkAts, getAtsHistory, getAtsHistoryItem, getAtsServiceStatus, getImproveLimitStatus } from '../api/atsApi';
import AtsResults from '../components/AtsResults';
import AtsHistoryPanel from '../components/AtsHistoryPanel';
import { fadeSlideUp, fadeSlideDown } from '../../../lib/motion';

// Two real phases happen server-side for an uploaded CV: a fast local text
// extraction, then a slower Gemini structured-extraction call — but it's
// all one HTTP request, so there's no real progress signal to report
// mid-flight. This swaps the loading label on a timer to reflect which
// phase is *likely* underway, without pretending to track real progress —
// deliberately no percentage/progress bar, just a label change.
function useTwoStageLoadingLabel(active) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    if (!active) {
      setStage(0);
      return;
    }
    const timer = setTimeout(() => setStage(1), 2500);
    return () => clearTimeout(timer);
  }, [active]);
  return stage === 0 ? 'Reading your CV…' : 'Preparing your CV for ATS analysis…';
}

function SourceToggle({ source, onChange, disabled }) {
  const options = [
    { value: 'saved', label: 'Choose from My Resumes', icon: 'description' },
    { value: 'upload', label: 'Upload CV', icon: 'upload_file' },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 mb-4" role="tablist" aria-label="CV source">
      {options.map((opt) => {
        const isActive = source === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-md border text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none ${
              isActive
                ? 'border-primary bg-soft-primary text-primary'
                : 'border-border text-text-secondary hover:border-text-secondary/40'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{opt.icon}</span>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default function ATSCheckerPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resumes, isLoading: resumesLoading, saveResume } = useResumes();
  const [source, setSource] = useState('saved'); // 'saved' | 'upload'
  const [resumeId, setResumeId] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [result, setResult] = useState(null);
  const [resultResumeId, setResultResumeId] = useState(null);
  const [improveCount, setImproveCount] = useState(0);
  const [improveLimit, setImproveLimit] = useState(null);
  const [improveDailyRemaining, setImproveDailyRemaining] = useState(null);

  // Upload-CV-for-ATS state — deliberately never touches the database.
  // uploadedCv holds the raw extraction draft (same shape POST
  // /resumes/upload always returns) only in memory; it's discarded on
  // "Check Again" / navigating away / a page refresh unless the user
  // explicitly clicks "Save to My Resumes" on the result.
  const fileInputRef = useRef(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadValidationError, setUploadValidationError] = useState('');
  const [uploadStage, setUploadStage] = useState('idle'); // idle | uploading | ready | error
  const [uploadError, setUploadError] = useState('');
  const [uploadedCv, setUploadedCv] = useState(null); // { extracted, suggestedTitle }
  const uploadLoadingLabel = useTwoStageLoadingLabel(uploadStage === 'uploading');

  // Result-side "was this check run against a temporary upload, and has it
  // been saved yet" — drives the "Save to My Resumes" action on the result.
  const [resultIsTemporary, setResultIsTemporary] = useState(false);
  const [tempSavedResumeId, setTempSavedResumeId] = useState(null);
  const [isSavingTempResume, setIsSavingTempResume] = useState(false);
  const [tempSaveError, setTempSaveError] = useState('');

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [checkCount, setCheckCount] = useState(0);
  const [checkLimit, setCheckLimit] = useState(null);
  const [checkDailyRemaining, setCheckDailyRemaining] = useState(null);

  // Lets the page show "is the ATS service actually up" without anyone
  // needing to check terminals. null = not checked yet (renders nothing).
  const [serviceStatus, setServiceStatus] = useState(null);

  const resumeOptions = resumes.map((r) => ({ value: r.id, label: r.title }));
  const resumeTitleById = Object.fromEntries(resumes.map((r) => [r.id, r.title]));

  // Two distinct caps, shown with distinct messages: a per-user lifetime
  // cap (isCapped) vs. a project-wide daily Gemini budget shared by every
  // user (isDailyCapped) — see the budget comment in atsController.js.
  const isCapped = checkLimit !== null && checkCount >= checkLimit;
  const isDailyCapped = checkDailyRemaining === 0;
  const isBlocked = isCapped || isDailyCapped;

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await getAtsHistory();
      setHistory(data.history);
      setCheckCount(data.count);
      setCheckLimit(data.limit);
      setCheckDailyRemaining(data.dailyGlobalRemaining ?? null);
    } catch {
      // History is supplementary — a failed load shouldn't block the page.
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    getAtsServiceStatus()
      .then((data) => setServiceStatus(data.available))
      .catch(() => setServiceStatus(null));
  }, []);

  const loadImproveLimit = useCallback(async () => {
    try {
      const data = await getImproveLimitStatus();
      setImproveCount(data.count);
      setImproveLimit(data.limit);
      setImproveDailyRemaining(data.dailyGlobalRemaining);
    } catch {
      // Non-critical — the Improve button just won't preemptively disable;
      // the backend still enforces both caps server-side either way.
    }
  }, []);

  useEffect(() => {
    loadImproveLimit();
  }, [loadImproveLimit]);

  const resetUpload = () => {
    setUploadFile(null);
    setUploadValidationError('');
    setUploadStage('idle');
    setUploadError('');
    setUploadedCv(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileSelected = (selected) => {
    setUploadValidationError('');
    setUploadError('');
    setUploadedCv(null);
    setUploadStage('idle');
    const validationError = validateCvFile(selected);
    if (validationError) {
      setUploadValidationError(validationError);
      setUploadFile(null);
      return;
    }
    setUploadFile(selected);
  };

  const handleFileInputChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) handleFileSelected(selected);
  };

  const handleExtractUpload = async () => {
    if (!uploadFile) return;
    setUploadStage('uploading');
    setUploadError('');
    try {
      const data = await uploadCv(uploadFile);
      setUploadedCv({
        extracted: data.extracted,
        suggestedTitle: data.suggestedTitle || 'Imported CV',
        template: data.template || null,
      });
      setUploadStage('ready');
    } catch (err) {
      if (err.code === 'GEMINI_QUOTA_EXCEEDED' || err.code === 'ATS_SERVICE_UNAVAILABLE') {
        setUploadError('AI processing is temporarily unavailable. Please try again later.');
      } else {
        setUploadError(err.message || "We couldn't extract the information from this CV. Please try again.");
      }
      setUploadStage('error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setServiceUnavailable(false);

    if (isCapped) {
      setError(`You've used all ${checkLimit} of your ATS checks.`);
      return;
    }
    if (isDailyCapped) {
      setError('The daily AI usage limit for ATS checks has been reached for all users. Please try again tomorrow.');
      return;
    }
    if (source === 'saved' && !resumeId) {
      setError('Please select a resume.');
      return;
    }
    if (source === 'upload' && !uploadedCv) {
      setError('Please upload and extract a CV first.');
      return;
    }
    if (!jobDescription.trim()) {
      setError('Please paste a job description.');
      return;
    }

    setIsSubmitting(true);
    setResult(null);
    try {
      const data =
        source === 'saved'
          ? await checkAts({ resumeId, jobDescription })
          : await checkAts({ temporaryResumeContent: uploadedCv.extracted, jobDescription });
      setResult(data);
      setResultResumeId(source === 'saved' ? resumeId : null);
      setResultIsTemporary(source === 'upload');
      setTempSavedResumeId(null);
      setTempSaveError('');
      setServiceStatus(true);
      // Both paths now write a history row (backend logs resumeId: null
      // for a temporary CV, purely so it counts toward the lifetime check
      // cap — see atsController.js) — refresh either way so the cap
      // display and Past Checks panel both stay accurate.
      loadHistory();
    } catch (err) {
      if (err.code === 'ATS_SERVICE_UNAVAILABLE') {
        setServiceUnavailable(true);
        setServiceStatus(false);
      } else {
        setError(err.message || 'Failed to run the ATS check.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckAgain = () => {
    setResult(null);
    setResultResumeId(null);
    setResultIsTemporary(false);
    setTempSavedResumeId(null);
    setTempSaveError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveTempResume = async () => {
    if (!uploadedCv) return;
    setIsSavingTempResume(true);
    setTempSaveError('');
    try {
      const resume = {
        id: generateUuid(),
        title: uploadedCv.suggestedTitle.trim() || 'Imported CV',
        templateId: 'classic',
        themeColor: '#4F46E5',
        updatedAt: new Date().toISOString(),
        content: mapExtractedToContent(uploadedCv.extracted),
        importedTemplateId:
          uploadedCv.template?.category === 'other' ? uploadedCv.template.other?.id : undefined,
      };
      const saved = await saveResume(resume);
      setTempSavedResumeId(saved.id);
    } catch (err) {
      setTempSaveError(err.message || 'Failed to save this resume. Please try again.');
    } finally {
      setIsSavingTempResume(false);
    }
  };

  const handleSelectHistory = async (id) => {
    setError('');
    try {
      const item = await getAtsHistoryItem(id);
      setResult(item.result);
      setResultResumeId(item.resumeId);
      setResultIsTemporary(false);
      setJobDescription(item.jobDescription || '');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message || 'Failed to load that past check.');
    }
  };

  // Deep link from the Dashboard's Recent Activity feed — arrives via
  // router state (never persisted) naming a specific past check to open
  // immediately. Cleared right away so a refresh/back doesn't reopen it.
  useEffect(() => {
    const openHistoryId = location.state?.openHistoryId;
    if (openHistoryId) {
      handleSelectHistory(openHistoryId);
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Deep link from the "Check ATS Score" action after a CV import
  // (UploadCvPage.jsx) — same router-state, clear-immediately convention
  // as openHistoryId above, just pre-selecting the resume instead of
  // opening a past result.
  useEffect(() => {
    const preselectResumeId = location.state?.resumeId;
    if (preselectResumeId) {
      setSource('saved');
      setResumeId(preselectResumeId);
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // For a temp-CV result, there's no resumeId until the user saves it —
  // effectiveResumeId is null before that (correctly hiding Fix-in-
  // Studio/Improve, see AtsResults' own canFixInStudio/canImprove gates)
  // and becomes the real new resume's id afterward.
  const effectiveResumeId = resultIsTemporary ? tempSavedResumeId : resultResumeId;
  const resumeStillExists = Boolean(effectiveResumeId && resumeTitleById[effectiveResumeId]);
  const activeResume = resumes.find((r) => r.id === effectiveResumeId);
  const selectedResumeTitle = resultIsTemporary
    ? uploadedCv?.suggestedTitle || 'Uploaded CV'
    : resumeTitleById[resultResumeId] || '(resume deleted)';

  return (
    <div>
      <PageHeader
        title="ATS Checker"
        description="Check a resume against a job description for keyword match and formatting issues. Results replace this form until you click Check Again."
      />

      {resumesLoading ? (
        <Loader message="Loading your resumes..." />
      ) : (
        <AnimatePresence mode="wait">
          {result ? (
            /* Results View — displayed directly without form clutter */
            <motion.div
              key="results"
              variants={fadeSlideUp}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-5 rounded-lg border border-border shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">fact_check</span>
                    <h2 className="text-lg font-bold text-text-primary">ATS Analysis Report</h2>
                  </div>
                  <p className="text-xs text-text-secondary mt-1">
                    Resume: <span className="font-semibold text-text-primary">{selectedResumeTitle}</span>
                    {resultIsTemporary && !tempSavedResumeId && (
                      <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-warning bg-warning/10 px-1.5 py-0.5 rounded">
                        Not saved
                      </span>
                    )}
                  </p>
                </div>
                <Button onClick={handleCheckAgain} variant="secondary" size="md">
                  <span className="material-symbols-outlined text-base mr-1.5">refresh</span>
                  Check Again
                </Button>
              </div>

              {resultIsTemporary && (
                <Card>
                  {tempSavedResumeId ? (
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-success text-[22px]">check_circle</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-text-primary">Saved to My Resumes</p>
                        <p className="text-xs text-text-secondary mt-0.5">
                          This CV is now a real resume — open it in Resume Studio anytime.
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/resume-studio/${tempSavedResumeId}`)}>
                        Open in Resume Studio
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-text-primary">This CV was only used for this check</p>
                        <p className="text-xs text-text-secondary mt-0.5">
                          It hasn't been saved anywhere. Save it to My Resumes to edit it in Resume Studio or run
                          Improve My Resume.
                        </p>
                        {tempSaveError && <ErrorMessage message={tempSaveError} className="mt-2" />}
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSaveTempResume}
                        isLoading={isSavingTempResume}
                        leftIcon={!isSavingTempResume ? <span className="material-symbols-outlined text-[18px]">save</span> : undefined}
                      >
                        {isSavingTempResume ? 'Saving…' : 'Save CV to My Resumes'}
                      </Button>
                    </div>
                  )}
                </Card>
              )}

              <AtsResults
                result={result}
                resumeId={resultIsTemporary ? tempSavedResumeId : (resumeStillExists ? effectiveResumeId : null)}
                onImprove={
                  activeResume
                    ? () =>
                        navigate('/ai-tailor', {
                          state: { resumeId: effectiveResumeId, jobDescription, currentAnalysis: result },
                        })
                    : undefined
                }
                improveDisabledReason={
                  improveLimit !== null && improveCount >= improveLimit
                    ? `You've used all ${improveLimit} of your resume improvements.`
                    : improveDailyRemaining === 0
                      ? 'The daily AI usage limit for resume improvements has been reached for all users. Please try again tomorrow.'
                      : null
                }
              />

              {/* Bottom Action Bar */}
              <div className="flex justify-center pt-2 pb-6">
                <Button onClick={handleCheckAgain} variant="primary" size="lg">
                  <span className="material-symbols-outlined text-lg mr-2">refresh</span>
                  Check Again / Run Another Check
                </Button>
              </div>
            </motion.div>
          ) : (
            /* Form View */
            <motion.div
              key="form"
              variants={fadeSlideUp}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              className="space-y-6"
            >
              <Card
                title="Run a check"
                subtitle={
                  checkLimit !== null
                    ? `${Math.max(checkLimit - checkCount, 0)} of ${checkLimit} checks remaining${checkDailyRemaining !== null ? ` · ${checkDailyRemaining} left today (all users)` : ''
                    }`
                    : undefined
                }
                headerActions={
                  serviceStatus === false ? (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-error">
                      <span className="w-1.5 h-1.5 rounded-full bg-error" />
                      Service offline
                    </span>
                  ) : serviceStatus === true ? (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
                      <span className="w-1.5 h-1.5 rounded-full bg-success" />
                      Service online
                    </span>
                  ) : null
                }
              >
                <form onSubmit={handleSubmit} className="space-y-4">
                  <AnimatePresence>
                    {serviceUnavailable && (
                      <motion.div
                        variants={fadeSlideDown}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        className="bg-error text-white rounded-lg p-4 flex gap-3 items-start"
                        role="alert"
                      >
                        <span className="material-symbols-outlined text-[22px] shrink-0">cloud_off</span>
                        <div>
                          <h5 className="font-bold">ATS analysis service unavailable</h5>
                          <p className="text-sm text-white/90 mt-0.5">
                            The ATS analysis service is currently unavailable. Your check did not run — please try again shortly.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {isCapped && (
                    <ErrorMessage
                      title="Check limit reached"
                      message={`You've used all ${checkLimit} of your ATS checks.`}
                    />
                  )}
                  {!isCapped && isDailyCapped && (
                    <ErrorMessage
                      title="Daily limit reached"
                      message="The daily AI usage limit for ATS checks has been reached for all users. This resets tomorrow — it's not tied to your personal check count."
                    />
                  )}

                  <SourceToggle
                    source={source}
                    disabled={isBlocked}
                    onChange={(next) => {
                      setSource(next);
                      setError('');
                    }}
                  />

                  {source === 'saved' ? (
                    resumes.length === 0 ? (
                      <EmptyState
                        icon="description"
                        title="No saved resumes yet"
                        description="Create a resume first, or switch to Upload CV above to check a file from your computer right away."
                        actionLabel="Create a resume"
                        actionHref="/my-resumes"
                      />
                    ) : (
                      <Select
                        label="Resume"
                        id="resumeId"
                        required
                        disabled={isBlocked}
                        value={resumeId}
                        onChange={(e) => setResumeId(e.target.value)}
                        options={resumeOptions}
                        placeholder="Select a resume"
                      />
                    )
                  ) : (
                    <div className="space-y-3">
                      <div
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                          uploadStage === 'error' ? 'border-error/40 bg-error/5' : 'border-border bg-bg-main'
                        }`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={handleFileInputChange}
                          className="hidden"
                          id="ats-cv-file-input"
                          disabled={isBlocked}
                        />

                        {!uploadFile ? (
                          <>
                            <span className="material-symbols-outlined text-[32px] text-primary/70 mb-1 block">
                              upload_file
                            </span>
                            <label htmlFor="ats-cv-file-input">
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                disabled={isBlocked}
                                onClick={() => fileInputRef.current?.click()}
                              >
                                Choose File
                              </Button>
                            </label>
                            <p className="text-xs text-text-secondary mt-2">PDF or DOCX, up to 5MB.</p>
                          </>
                        ) : (
                          <div className="flex items-center justify-center gap-3">
                            <span className="material-symbols-outlined text-[22px] text-text-secondary">
                              description
                            </span>
                            <div className="text-left">
                              <p className="text-sm font-medium text-text-primary truncate max-w-xs">
                                {uploadFile.name}
                              </p>
                              <p className="text-xs text-text-secondary">{formatFileSize(uploadFile.size)}</p>
                            </div>
                            {uploadStage !== 'uploading' && (
                              <button
                                type="button"
                                onClick={resetUpload}
                                aria-label="Remove file"
                                className="p-1.5 rounded-md text-text-secondary hover:text-error hover:bg-error/10 transition-colors"
                              >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {uploadValidationError && <ErrorMessage message={uploadValidationError} />}
                      {uploadStage === 'error' && uploadError && <ErrorMessage message={uploadError} />}

                      {uploadStage === 'uploading' && (
                        <div className="flex items-center gap-3 text-sm text-text-secondary bg-soft-primary/50 rounded-lg p-3">
                          <svg className="animate-spin h-4 w-4 text-primary shrink-0" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          {uploadLoadingLabel}
                        </div>
                      )}

                      {uploadStage === 'ready' && uploadedCv && (
                        <div className="flex items-center gap-2 text-sm text-success bg-success/10 rounded-lg p-3">
                          <span className="material-symbols-outlined text-[18px]">check_circle</span>
                          CV extracted — ready for ATS analysis.
                        </div>
                      )}

                      {uploadStage === 'ready' && uploadedCv?.template && (
                        <div className="flex items-center gap-2 text-xs font-medium text-text-secondary bg-bg-main border border-border rounded-md px-3 py-2 w-fit">
                          <span className="material-symbols-outlined text-[16px] text-primary">
                            {uploadedCv.template.category === 'built-in' ? 'verified' : 'description'}
                          </span>
                          {uploadedCv.template.category === 'built-in'
                            ? `Previously exported with this app's "${uploadedCv.template.templateId}" template`
                            : 'Design not recognized — filed under "Other" in Templates if saved'}
                        </div>
                      )}

                      {uploadFile && uploadStage !== 'ready' && (
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleExtractUpload}
                            disabled={isBlocked || uploadStage === 'uploading'}
                            isLoading={uploadStage === 'uploading'}
                          >
                            {uploadStage === 'uploading' ? 'Extracting…' : 'Extract CV'}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  <TextArea
                    label="Job Description"
                    id="jobDescription"
                    required
                    disabled={isBlocked}
                    rows={8}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the full job description here..."
                    helpText="Keywords, skills, and tools mentioned here are checked against the selected resume."
                  />

                  {error && !isBlocked && <ErrorMessage message={error} />}

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      isLoading={isSubmitting}
                      disabled={isBlocked || (source === 'upload' && !uploadedCv)}
                    >
                      {isSubmitting ? 'Checking...' : 'Check ATS Score'}
                    </Button>
                  </div>
                </form>
              </Card>

              <AtsHistoryPanel
                history={history}
                resumeTitleById={resumeTitleById}
                onSelect={handleSelectHistory}
                isLoading={historyLoading}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
