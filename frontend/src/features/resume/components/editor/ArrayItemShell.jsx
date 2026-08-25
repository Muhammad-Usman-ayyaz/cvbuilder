import { useState } from 'react';

/**
 * Collapsible card wrapper for a single entry in a repeatable array field
 * (one experience, one education entry, one project). Shared by
 * ExperienceForm, EducationForm, and ProjectsForm so reorder/remove/collapse
 * behavior and styling stay identical across all three.
 *
 * @param {{
 *   title: string,
 *   subtitle?: string,
 *   defaultOpen?: boolean,
 *   onRemove?: () => void,
 *   onMoveUp?: () => void,
 *   onMoveDown?: () => void,
 *   isFirst?: boolean,
 *   isLast?: boolean,
 *   removeLabel?: string,
 *   children: React.ReactNode,
 * }} props
 */
export default function ArrayItemShell({
    title,
    subtitle,
    defaultOpen = true,
    onRemove,
    onMoveUp,
    onMoveDown,
    isFirst = false,
    isLast = false,
    removeLabel = 'Remove entry',
    children,
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border border-border rounded-lg bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2.5 bg-bg-main/50">
                <button
                    type="button"
                    onClick={() => setIsOpen((v) => !v)}
                    className="flex-1 flex items-center gap-2 min-w-0 text-left"
                    aria-expanded={isOpen}
                >
                    <span
                        className="material-symbols-outlined text-[18px] text-text-secondary shrink-0 transition-transform duration-200"
                        style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                    >
                        expand_more
                    </span>
                    <span className="min-w-0">
                        <span className="block text-sm font-semibold text-text-primary truncate">
                            {title || 'Untitled entry'}
                        </span>
                        {subtitle && (
                            <span className="block text-xs text-text-secondary truncate">{subtitle}</span>
                        )}
                    </span>
                </button>

                <div className="flex items-center gap-0.5 shrink-0">
                    {onMoveUp && (
                        <button
                            type="button"
                            onClick={onMoveUp}
                            disabled={isFirst}
                            aria-label="Move up"
                            className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-border/50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                        </button>
                    )}
                    {onMoveDown && (
                        <button
                            type="button"
                            onClick={onMoveDown}
                            disabled={isLast}
                            aria-label="Move down"
                            className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-border/50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                        </button>
                    )}
                    {onRemove && (
                        <button
                            type="button"
                            onClick={onRemove}
                            aria-label={removeLabel}
                            className="p-1.5 rounded-md text-text-secondary hover:text-error hover:bg-red-50 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px]">delete_outline</span>
                        </button>
                    )}
                </div>
            </div>

            {isOpen && <div className="p-4 space-y-4 border-t border-border">{children}</div>}
        </div>
    );
}