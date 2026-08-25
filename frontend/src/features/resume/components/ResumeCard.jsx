import Badge from '../../../components/common/Badge';
import { formatUpdatedAt } from '../utils/resumeModel';
import { getTemplateMeta } from '../utils/templateMeta';
import ResumeCanvas from './studio/ResumeCanvas';
import { useFitScale } from '../hooks/useFitScale';

const A4_WIDTH = 794; // must match ResumeCanvas's A4_WIDTH

/**
 * A single resume's card in the MyResumesPage grid. Shows title, template
 * badge, last-updated label, and inline actions (open/duplicate/delete).
 *
 * @param {{
 *   resume: import('../utils/resumeModel').ResumeDocument,
 *   onOpen: (id: string) => void,
 *   onDuplicate: (id: string) => void,
 *   onDelete: (id: string) => void,
 * }} props
 */
export default function ResumeCard({ resume, onOpen, onDuplicate, onDelete }) {
    const templateMeta = getTemplateMeta(resume.templateId);
    const [previewRef, previewScale] = useFitScale(A4_WIDTH);

    return (
        <div className="group border border-border rounded-xl bg-card overflow-hidden hover:border-primary/40 hover:shadow-md transition-all">
            {/* Live preview strip — a true miniature of the resume itself,
                rendered via ResumeCanvas and scaled to exactly fill this
                card's width so it reads like a thumbnail image. */}
            <button
                type="button"
                onClick={() => onOpen(resume.id)}
                className="block w-full aspect-[794/1123] bg-bg-main relative overflow-hidden text-left"
            >
                <div ref={previewRef} className="absolute inset-0 pointer-events-none">
                    {previewScale > 0 && (
                        <ResumeCanvas resume={resume} scale={previewScale} />
                    )}
                </div>

                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/0 group-hover:bg-slate-900/30 transition-colors">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 rounded-md bg-white text-slate-900 text-xs font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                        Open
                    </span>
                </div>
            </button>

            <div className="p-3.5">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="text-sm font-semibold text-text-primary truncate">
                        {resume.title || 'Untitled Resume'}
                    </h3>
                </div>

                <div className="flex items-center gap-2 mb-3">
                    {templateMeta && (
                        <Badge variant="primary" size="sm">
                            {templateMeta.name}
                        </Badge>
                    )}
                    <span className="text-xs text-text-secondary">{formatUpdatedAt(resume.updatedAt)}</span>
                </div>

                <div className="flex items-center gap-1 pt-2 border-t border-border">
                    <button
                        type="button"
                        onClick={() => onOpen(resume.id)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-medium text-text-secondary hover:text-primary hover:bg-soft-indigo transition-colors"
                    >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                        Edit
                    </button>
                    <button
                        type="button"
                        onClick={() => onDuplicate(resume.id)}
                        aria-label="Duplicate resume"
                        className="p-1.5 rounded-md text-text-secondary hover:text-primary hover:bg-soft-indigo transition-colors"
                    >
                        <span className="material-symbols-outlined text-[16px]">content_copy</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(resume.id)}
                        aria-label="Delete resume"
                        className="p-1.5 rounded-md text-text-secondary hover:text-error hover:bg-red-50 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[16px]">delete_outline</span>
                    </button>
                </div>
            </div>
        </div>
    );
}