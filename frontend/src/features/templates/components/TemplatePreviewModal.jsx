import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ResumeCanvas from '../../resume/components/studio/ResumeCanvas';
import { useFitScale } from '../../resume/hooks/useFitScale';
import { fadeOnly, fadeScale } from '../../../lib/motion';

const A4_WIDTH = 794;

export default function TemplatePreviewModal({
    isOpen,
    template,
    previewResume,
    onClose,
    onSelect,
    isSubmitting = false,
}) {
    // Fit canvas scale inside preview area
    const [canvasRef, scale] = useFitScale(A4_WIDTH);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!template) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
                    {/* Backdrop */}
                    <motion.div
                        variants={fadeOnly}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
                        onClick={onClose}
                        aria-hidden="true"
                    />

                    {/* Dialog Window */}
                    <motion.div
                        variants={fadeScale}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="template-preview-title"
                        className="relative w-full max-w-4xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden z-10"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-4 bg-bg-main/50 shrink-0">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-[20px]">
                                        {template.icon}
                                    </span>
                                    <h2
                                        id="template-preview-title"
                                        className="text-base sm:text-lg font-extrabold text-text-primary tracking-tight truncate"
                                    >
                                        {template.name} Template Preview
                                    </h2>
                                    {template.tagline && (
                                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-soft-primary text-primary hidden sm:inline-block">
                                            {template.tagline}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-text-secondary truncate mt-0.5">
                                    {template.description}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Close preview"
                                className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-main border border-transparent hover:border-border transition-colors shrink-0"
                            >
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>

                        {/* Preview Body (Scrollable A4 Canvas Container) */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-bg-main/70 flex justify-center items-start">
                            <div
                                ref={canvasRef}
                                className="w-full max-w-[680px] flex justify-center shadow-lg rounded-md overflow-hidden bg-white"
                            >
                                {scale > 0 && previewResume && (
                                    <ResumeCanvas
                                        resume={previewResume}
                                        scale={Math.min(scale, 0.85)}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="px-6 py-3.5 border-t border-border bg-card flex items-center justify-between gap-3 shrink-0">
                            <div className="text-xs text-text-secondary hidden sm:block">
                                You can switch templates anytime from the Studio without losing content.
                            </div>

                            <div className="flex items-center gap-2.5 ml-auto">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 rounded-xl border border-border hover:bg-bg-main text-text-primary text-xs font-semibold transition-colors"
                                >
                                    Close
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onSelect(template.id)}
                                    disabled={isSubmitting}
                                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                                    ) : (
                                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                                    )}
                                    <span>Use This Template</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
