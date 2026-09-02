import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getResumeById } from '../api/resumeApi';
import { fadeSlideDown } from '../../../lib/motion';
import { useResumes } from '../hooks/useResumes';
import Card from '../../../components/common/Card';
import StudioHeader from '../components/studio/StudioHeader';
import TemplateSwitcher from '../components/studio/TemplateSwitcher';
import ThemeColorPicker from '../components/studio/ThemeColorPicker';
import ResumeCanvas from '../components/studio/ResumeCanvas';
import EditorTabs from '../components/editor/EditorTabs';
import { exportResumeAsPdf } from '../utils/exportPdf';

const AUTOSAVE_DELAY_MS = 800;

// Mirrors AtsResults.jsx's CHECK_SECTION_MAP tab ids — used only to render
// the human-readable tab name in the "fix this" banner passed via router
// state from the ATS Checker's "Fix in Studio" link.
const TAB_LABELS = {
    personal: 'Personal',
    education: 'Education',
    experience: 'Experience',
    projects: 'Projects',
    skills: 'Skills',
};

export default function ResumeStudioPage() {
    const { resumeId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { saveResume } = useResumes();

    const [resume, setResume] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [saveStatus, setSaveStatus] = useState('saved');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isDesignOpen, setIsDesignOpen] = useState(false);
    const [mobileScale, setMobileScale] = useState(0.38); // Default fit

    // Transient "fix this" guidance passed from the ATS Checker's "Fix in
    // Studio" link (missing keywords / failed formatting checks for the
    // resume just analyzed). Only present when arriving via that deep
    // link — a normal visit to Studio has no router state, so this stays
    // null and the banner never renders. Not persisted anywhere.
    const [atsFix, setAtsFix] = useState(() => location.state?.atsFix ?? null);

    // Strip the router state immediately so a page refresh or browser
    // back/forward doesn't resurrect the banner from history.state.
    useEffect(() => {
        if (location.state?.atsFix) {
            navigate(location.pathname, { replace: true, state: {} });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Once the resume has loaded and the Personal tab (the default tab)
    // has rendered, scroll to and focus the Professional Summary field —
    // the most natural place to weave in missing keywords.
    useEffect(() => {
        if (!atsFix || !resume) return;
        const timeoutId = setTimeout(() => {
            const el = document.getElementById('personal-summary');
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.focus({ preventScroll: true });
            }
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [atsFix, resume]);

    useEffect(() => {
        if (!isDesignOpen) {
            setMobileScale(0.38);
        } else if (isDropdownOpen) {
            setMobileScale(0.16);
        } else {
            setMobileScale(0.28);
        }
    }, [isDesignOpen, isDropdownOpen]);

    const autosaveTimeoutRef = useRef(null);
    const isFirstRenderRef = useRef(true);

    // Initial load
    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                const found = await getResumeById(resumeId);
                if (cancelled) return;
                if (!found) {
                    setNotFound(true);
                    return;
                }
                setResume(found);
                isFirstRenderRef.current = true;
            } catch (err) {
                console.error('Failed to load resume', err);
                if (!cancelled) setNotFound(true);
            }
        }
        load();
        return () => {
            cancelled = true;
        };
    }, [resumeId]);

    // Debounced autosave
    useEffect(() => {
        if (!resume) return;
        if (isFirstRenderRef.current) {
            isFirstRenderRef.current = false;
            return;
        }

        setSaveStatus('unsaved');
        clearTimeout(autosaveTimeoutRef.current);
        autosaveTimeoutRef.current = setTimeout(async () => {
            setSaveStatus('saving');
            try {
                const saved = await saveResume(resume);
                setResume((prev) => (prev ? { ...prev, updatedAt: saved.updatedAt } : prev));
                setSaveStatus('saved');
            } catch (err) {
                console.error('Autosave failed', err);
                setSaveStatus('unsaved');
            }
        }, AUTOSAVE_DELAY_MS);

        return () => clearTimeout(autosaveTimeoutRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resume?.title, resume?.templateId, resume?.themeColor, resume?.content]);

    if (notFound) {
        navigate('/my-resumes', { replace: true });
        return null;
    }

    if (!resume) {
        return (
            <div className="flex items-center justify-center h-screen bg-bg-main">
                <span className="material-symbols-outlined text-[28px] text-text-secondary animate-spin">
                    progress_activity
                </span>
            </div>
        );
    }

    return (
        <motion.div
            className="flex flex-col h-screen bg-bg-main overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
        >
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #resume-print-area,
                    #resume-print-area * {
                        visibility: visible;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }
                    #resume-print-area {
                        display: flex !important;
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        margin: 0;
                        padding: 0;
                        overflow: visible;
                    }
                    @page {
                        margin: 0;
                    }
                }
            `}</style>

            <div className="print:hidden flex-none z-20">
                <StudioHeader
                    title={resume.title}
                    onTitleChange={(nextTitle) => setResume((prev) => ({ ...prev, title: nextTitle }))}
                    onBack={() => navigate('/my-resumes')}
                    onExportPdf={() => exportResumeAsPdf(resume)}
                    saveStatus={saveStatus}
                    resume={resume}
                />
                <AnimatePresence>
                    {atsFix && (atsFix.missingKeywords?.length > 0 || atsFix.failedChecks?.length > 0) && (
                        <motion.div
                            variants={fadeSlideDown}
                            initial="hidden"
                            animate="show"
                            exit="exit"
                            className="bg-soft-primary border-b border-primary/20 px-4 py-3 flex items-start gap-3"
                        >
                            <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">
                                lightbulb
                            </span>
                            <div className="flex-1 min-w-0 text-sm space-y-1.5">
                                {atsFix.missingKeywords?.length > 0 && (
                                    <p className="text-text-primary">
                                        <span className="font-semibold">Missing from your resume:</span>{' '}
                                        {atsFix.missingKeywords.join(', ')} — consider weaving these into your Professional
                                        Summary or the relevant section below.
                                    </p>
                                )}
                                {atsFix.failedChecks?.length > 0 && (
                                    <ul className="space-y-1">
                                        {atsFix.failedChecks.map((check) => (
                                            <li key={check.label} className="text-xs text-text-secondary">
                                                <span className="font-semibold text-text-primary">
                                                    {check.label}
                                                    {check.section && ` (${TAB_LABELS[check.section]} tab)`}:
                                                </span>{' '}
                                                {check.note}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setAtsFix(null)}
                                aria-label="Dismiss"
                                className="p-1 rounded-full text-text-secondary hover:text-text-primary hover:bg-black/5 transition-colors shrink-0"
                            >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex flex-1 min-h-0 relative flex-col lg:flex-row">
                {/* Left Panel container */}
                <div className="w-full lg:w-[46%] xl:w-[42%] flex flex-col lg:overflow-y-auto border-r border-border p-4 lg:p-5 lg:space-y-5 h-full min-h-0 z-10">
                    
                    {/* Fixed top portion on mobile, normal flow on desktop */}
                    <div className="flex-none flex flex-col">
                        <Card 
                            title="Design" 
                            headerActions={
                                <button 
                                    className="p-1 rounded-full hover:bg-bg-main transition-colors text-text-secondary"
                                    onClick={() => setIsDesignOpen(!isDesignOpen)}
                                >
                                    <span className="material-symbols-outlined">
                                        {isDesignOpen ? 'expand_less' : 'expand_more'}
                                    </span>
                                </button>
                            }
                            overflowVisible 
                            className="shrink-0 mb-4 lg:mb-0 z-50"
                            noPadding={!isDesignOpen}
                        >
                            <div className={`space-y-4 p-4 lg:p-5 ${isDesignOpen ? 'block' : 'hidden'}`}>
                                <div>
                                    <p className="text-xs font-medium text-text-secondary mb-2">Template</p>
                                    <TemplateSwitcher
                                        value={resume.templateId}
                                        onChange={(nextTemplateId) =>
                                            setResume((prev) => ({ ...prev, templateId: nextTemplateId }))
                                        }
                                        onToggle={(isOpen) => setIsDropdownOpen(isOpen)}
                                    />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-text-secondary mb-2">Accent Color</p>
                                    <ThemeColorPicker
                                        value={resume.themeColor}
                                        onChange={(nextColor) => setResume((prev) => ({ ...prev, themeColor: nextColor }))}
                                    />
                                </div>
                            </div>
                        </Card>
                        
                        {/* Mobile Canvas - Dynamic Scaling */}
                        <div 
                            className="lg:hidden shrink-0 bg-bg-main border border-border rounded-lg mb-4 overflow-auto transition-all duration-300 relative z-0 print:hidden" 
                            style={{ height: !isDesignOpen ? '420px' : isDropdownOpen ? '180px' : '310px' }}
                        >
                            <div className="min-w-fit min-h-fit p-2 flex justify-center">
                                <ResumeCanvas resume={resume} scale={mobileScale} />
                            </div>
                        </div>
                    </div>

                    {/* Scrollable bottom portion on mobile, normal flow on desktop */}
                    <div className="flex-1 overflow-y-auto lg:overflow-visible min-h-0 bg-card rounded-lg shadow-sm border border-border lg:border-none lg:shadow-none lg:bg-transparent z-10" id="editor-scroll-container">
                        <Card noPadding className="border-none shadow-none lg:border-solid lg:shadow-sm">
                            <div className="p-4 lg:p-5">
                                <EditorTabs
                                    content={resume.content}
                                    onChange={(nextContent) => setResume((prev) => ({ ...prev, content: nextContent }))}
                                />
                            </div>
                        </Card>
                    </div>
                </div>
                
                {/* Right Panel - Desktop Canvas (Also used for printing) */}
                <div id="resume-print-area" className="hidden lg:flex flex-1 items-start justify-center overflow-auto p-8 bg-bg-main print:p-0 print:items-stretch print:justify-start print:bg-white pb-24 lg:pb-8 z-0">
                    <ResumeCanvas resume={resume} scale={0.78} className="print:!scale-100 print:shadow-none" />
                </div>
            </div>
        </motion.div>
    );
}