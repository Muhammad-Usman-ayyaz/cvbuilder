import { motion } from 'framer-motion';
import ResumeCanvas from '../../resume/components/studio/ResumeCanvas';
import { useFitScale } from '../../resume/hooks/useFitScale';
import { fadeSlideUp } from '../../../lib/motion';

const A4_WIDTH = 794;

export default function TemplateCard({
    template,
    previewResume,
    onPreview,
    onSelect,
    isSelected = false,
    isSubmitting = false,
}) {
    const [canvasContainerRef, scale] = useFitScale(A4_WIDTH);

    return (
        <motion.div
            variants={fadeSlideUp}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className={`group rounded-2xl border bg-card flex flex-col overflow-hidden transition-all duration-200 shadow-xs hover:shadow-xl dark:hover:shadow-black/60 ${
                isSelected
                    ? 'border-primary ring-2 ring-primary/30 shadow-md'
                    : 'border-border hover:border-primary/50'
            }`}
        >
            {/* Visual Canvas Container (A4 aspect ratio) */}
            <div className="relative w-full aspect-[794/1040] bg-bg-main overflow-hidden border-b border-border/70 select-none">
                <div ref={canvasContainerRef} className="absolute inset-0 pointer-events-none">
                    {scale > 0 && previewResume && (
                        <ResumeCanvas resume={previewResume} scale={scale} />
                    )}
                </div>

                {/* Top Badge: Template Name & Tagline */}
                <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none z-10">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-card/90 dark:bg-card/95 backdrop-blur-md text-xs font-extrabold text-text-primary border border-border shadow-xs">
                        <span className="material-symbols-outlined text-[15px] text-primary">{template.icon}</span>
                        {template.name}
                    </span>

                    {isSelected && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-white text-[11px] font-bold shadow-xs">
                            <span className="material-symbols-outlined text-[13px]">check_circle</span>
                            Selected
                        </span>
                    )}
                </div>

                {/* Hover Reveal Overlay with Quick Preview */}
                <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/30 dark:group-hover:bg-slate-950/50 backdrop-blur-[1.5px] opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center p-4">
                    <button
                        type="button"
                        onClick={() => onPreview(template)}
                        className="scale-95 group-hover:scale-100 transition-transform duration-200 px-4 py-2 rounded-xl bg-card text-text-primary text-xs font-bold shadow-lg hover:bg-bg-main flex items-center gap-1.5 border border-border"
                    >
                        <span className="material-symbols-outlined text-[16px] text-primary">visibility</span>
                        <span>Full Size Preview</span>
                    </button>
                </div>
            </div>

            {/* Template Information & Metadata */}
            <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                <div className="space-y-2">
                    <div className="flex items-baseline justify-between gap-2">
                        <h3 className="text-base font-extrabold text-text-primary tracking-tight">
                            {template.name}
                        </h3>
                        {template.tagline && (
                            <span className="text-xs font-semibold text-primary">
                                {template.tagline}
                            </span>
                        )}
                    </div>

                    <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                        {template.description}
                    </p>

                    {/* Metadata Badges */}
                    {template.metadataBadges?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {template.metadataBadges.map((badge) => (
                                <span
                                    key={badge}
                                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-bg-main border border-border/80 text-text-secondary"
                                >
                                    {badge}
                                </span>
                            ))}
                        </div>
                    )}

                    {template.bestFor && (
                        <p className="text-[11px] text-text-secondary/90 pt-1">
                            <span className="font-semibold text-text-primary">Best for: </span>
                            {template.bestFor}
                        </p>
                    )}
                </div>

                {/* Card Action CTAs */}
                <div className="pt-3 border-t border-border/70 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => onPreview(template)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-border hover:border-primary/40 bg-card hover:bg-bg-main text-text-primary text-xs font-semibold transition-colors"
                    >
                        <span className="material-symbols-outlined text-[16px] text-text-secondary">zoom_in</span>
                        <span>Preview</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => onSelect(template.id)}
                        disabled={isSubmitting}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                        ) : (
                            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                        )}
                        <span>Use Template</span>
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
