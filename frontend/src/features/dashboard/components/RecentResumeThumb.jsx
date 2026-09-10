import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ResumeCanvas from '../../resume/components/studio/ResumeCanvas';
import { useFitScale } from '../../resume/hooks/useFitScale';
import { formatUpdatedAt } from '../../resume/utils/resumeModel';
import { getTemplateMeta } from '../../resume/utils/templateMeta';
import { fadeSlideUp } from '../../../lib/motion';

const A4_WIDTH = 794;

function atsScoreColor(score) {
    if (score >= 75) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    if (score >= 45) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
}

/**
 * Premium document card for Dashboard "Recent Resumes" grid.
 * Displays live A4 thumbnail, template badge, ATS score badge,
 * document title, subtitle, relative edit timestamp, and hover affordances.
 */
export default function RecentResumeThumb({ resume, atsScore }) {
    const navigate = useNavigate();
    const [previewRef, previewScale] = useFitScale(A4_WIDTH);
    const templateMeta = getTemplateMeta(resume.templateId);
    const subtitle = resume.content?.personal?.professionalTitle || templateMeta?.name || 'Resume Document';

    return (
        <motion.div
            variants={fadeSlideUp}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            onClick={() => navigate(`/resume-studio/${resume.id}`)}
            className="group cursor-pointer text-left rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 hover:shadow-md dark:hover:shadow-black/40 transition-all flex flex-col h-full select-none"
        >
            {/* Live A4 Preview Container */}
            <div className="w-full aspect-[794/1100] bg-bg-main relative overflow-hidden border-b border-border/60">
                <div ref={previewRef} className="absolute inset-0 pointer-events-none">
                    {previewScale > 0 && <ResumeCanvas resume={resume} scale={previewScale} />}
                </div>

                {/* Floating Meta Badges */}
                <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none z-10">
                    {templateMeta ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-card/90 dark:bg-card/95 backdrop-blur-sm text-text-secondary border border-border/80 shadow-xs">
                            {templateMeta.name}
                        </span>
                    ) : <span />}

                    {typeof atsScore === 'number' && (
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border backdrop-blur-sm shadow-xs flex items-center gap-1 ${atsScoreColor(atsScore)}`}>
                            <span className="material-symbols-outlined text-[13px]">fact_check</span>
                            {atsScore}% ATS
                        </span>
                    )}
                </div>

                {/* Hover Reveal Overlay with Action Pill */}
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/0 group-hover:bg-slate-950/30 dark:group-hover:bg-slate-950/50 backdrop-blur-[1px] transition-all duration-200">
                    <span className="opacity-0 group-hover:opacity-100 group-hover:scale-100 scale-95 transition-all duration-200 px-3.5 py-1.5 rounded-lg bg-white text-slate-900 dark:bg-primary dark:text-white text-xs font-bold shadow-md flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                        Open in Studio
                    </span>
                </div>
            </div>

            {/* Document Info Footer */}
            <div className="p-3.5 flex flex-col justify-between flex-1">
                <div>
                    <h3 className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors truncate">
                        {resume.title || 'Untitled Resume'}
                    </h3>
                    <p className="text-xs text-text-secondary truncate mt-0.5">
                        {subtitle}
                    </p>
                </div>

                <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-border/60 text-xs">
                    <span className="text-[11px] text-text-secondary font-medium">
                        Edited {formatUpdatedAt(resume.updatedAt)}
                    </span>
                    <span className="text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        Open
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </span>
                </div>
            </div>
        </motion.div>
    );
}