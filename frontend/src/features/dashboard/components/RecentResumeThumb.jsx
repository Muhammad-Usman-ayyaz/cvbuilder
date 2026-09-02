import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ResumeCanvas from '../../resume/components/studio/ResumeCanvas';
import { useFitScale } from '../../resume/hooks/useFitScale';
import { formatUpdatedAt } from '../../resume/utils/resumeModel';
import { fadeSlideUp, cardHover, cardTap } from '../../../lib/motion';

const A4_WIDTH = 794; // must match ResumeCanvas's A4_WIDTH

/**
 * Small clickable resume thumbnail for the Dashboard's "Recent Resumes"
 * list. Deliberately simpler than the full ResumeCard used on
 * MyResumesPage — just a live preview, title, and last-updated label, no
 * duplicate/delete actions (those live on the My Resumes page itself).
 *
 * @param {{ resume: import('../../resume/utils/resumeModel').ResumeDocument }} props
 */
export default function RecentResumeThumb({ resume }) {
    const navigate = useNavigate();
    const [previewRef, previewScale] = useFitScale(A4_WIDTH);

    return (
        <motion.button
            type="button"
            onClick={() => navigate(`/resume-studio/${resume.id}`)}
            variants={fadeSlideUp}
            className="group text-left rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden hover:border-[var(--color-primary)]/40 hover:shadow-sm transition-all"
        >
            <div className="w-full aspect-[794/1123] bg-[var(--color-bg-main)] relative overflow-hidden">
                <div ref={previewRef} className="absolute inset-0 pointer-events-none">
                    {previewScale > 0 && <ResumeCanvas resume={resume} scale={previewScale} />}
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/0 group-hover:bg-slate-900/30 transition-colors">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 rounded-md bg-white text-slate-900 text-xs font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                        Open
                    </span>
                </div>
            </div>

            <div className="p-3">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                    {resume.title || 'Untitled Resume'}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    {formatUpdatedAt(resume.updatedAt)}
                </p>
            </div>
        </motion.button>
    );
}