import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TEMPLATES } from '../../utils/templateMeta';
import ResumeCanvas from './ResumeCanvas';
import { useFitScale } from '../../hooks/useFitScale';
import { fadeOnly, fadeScale } from '../../../../lib/motion';

const A4_WIDTH = 794;

function DesignOptionCard({ template, resume, isActive, onApply }) {
    const [containerRef, scale] = useFitScale(A4_WIDTH);

    // Build preview with the current resume's actual content rendered in this template
    const previewResume = {
        ...resume,
        templateId: template.id,
    };

    return (
        <div
            className={`rounded-xl border flex flex-col overflow-hidden transition-all duration-200 ${
                isActive
                    ? 'border-primary ring-2 ring-primary/20 bg-soft-primary/10 dark:bg-card shadow-sm'
                    : 'border-border bg-card hover:border-primary/40 hover:shadow-md'
            }`}
        >
            {/* Live Miniature A4 Canvas Preview */}
            <div className="relative w-full aspect-[794/1040] bg-bg-main overflow-hidden border-b border-border/70 select-none">
                <div ref={containerRef} className="absolute inset-0 pointer-events-none">
                    {scale > 0 && <ResumeCanvas resume={previewResume} scale={scale} />}
                </div>

                {/* Top Badge */}
                <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none z-10">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-card/90 dark:bg-card/95 backdrop-blur-sm text-text-primary border border-border shadow-xs">
                        {template.name}
                    </span>
                    {isActive && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary text-white shadow-xs flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">check</span>
                            Current
                        </span>
                    )}
                </div>
            </div>

            {/* Template Information & Action */}
            <div className="p-3.5 flex flex-col justify-between flex-1 gap-2.5">
                <div>
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-text-primary">
                            {template.name}
                        </h4>
                        {template.tagline && (
                            <span className="text-[10px] font-semibold text-primary">
                                {template.tagline}
                            </span>
                        )}
                    </div>
                    <p className="text-[11px] text-text-secondary line-clamp-2 mt-0.5">
                        {template.description}
                    </p>
                </div>

                <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                    <span className="text-[10px] text-text-secondary font-medium">
                        {template.metadataBadges?.[0] || 'Single Column'}
                    </span>

                    {isActive ? (
                        <span className="text-[11px] font-bold text-primary flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[14px]">check_circle</span>
                            Active
                        </span>
                    ) : (
                        <button
                            type="button"
                            onClick={() => onApply(template.id)}
                            className="px-3 py-1 rounded-lg bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary-hover active:scale-[0.98] transition-all cursor-pointer"
                        >
                            Apply
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ChangeDesignModal({
    isOpen,
    currentTemplateId,
    resume,
    onClose,
    onApply,
}) {
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!resume) return null;

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

                    {/* Modal Window */}
                    <motion.div
                        variants={fadeScale}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="change-design-title"
                        className="relative w-full max-w-3xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden z-10"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-4 bg-bg-main/40 shrink-0">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-[20px]">
                                        palette
                                    </span>
                                    <h2
                                        id="change-design-title"
                                        className="text-base sm:text-lg font-extrabold text-text-primary tracking-tight"
                                    >
                                        Change Resume Design
                                    </h2>
                                </div>
                                <p className="text-xs text-text-secondary mt-0.5">
                                    Switch your resume design anytime. All your sections and content are 100% preserved.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Close"
                                className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-main border border-transparent hover:border-border transition-colors shrink-0 cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>

                        {/* Template Options Grid */}
                        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-bg-main/60">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {TEMPLATES.map((template) => (
                                    <DesignOptionCard
                                        key={template.id}
                                        template={template}
                                        resume={resume}
                                        isActive={template.id === currentTemplateId}
                                        onApply={(newTemplateId) => {
                                            onApply(newTemplateId);
                                            onClose();
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-3 border-t border-border bg-card flex items-center justify-between text-xs text-text-secondary shrink-0">
                            <span>Changes are saved automatically to your resume.</span>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-1.5 rounded-lg border border-border hover:bg-bg-main text-text-primary font-semibold transition-colors cursor-pointer"
                            >
                                Done
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
