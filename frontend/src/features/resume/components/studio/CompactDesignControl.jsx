import { getTemplateMeta } from '../../utils/templateMeta';

/**
 * Compact Design Control for Resume Studio.
 * Replaces bulky dropdowns with a sleek, tactile design button:
 * ┌──────────────────────┐
 * │ DESIGN               │
 * │ Modern            ▼  │
 * └──────────────────────┘
 *
 * @param {{
 *   templateId: string,
 *   onClick: () => void,
 * }} props
 */
export default function CompactDesignControl({ templateId, onClick }) {
    const template = getTemplateMeta(templateId);

    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-150 shadow-xs group text-left cursor-pointer"
        >
            <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-soft-primary text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[18px]">
                        {template.icon || 'style'}
                    </span>
                </div>
                <div className="min-w-0">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary leading-none">
                        DESIGN
                    </span>
                    <span className="block text-sm font-bold text-text-primary group-hover:text-primary transition-colors truncate mt-1">
                        {template.name}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-1 text-text-secondary group-hover:text-primary transition-colors shrink-0">
                <span className="text-xs font-semibold hidden sm:inline">Change</span>
                <span className="material-symbols-outlined text-[20px]">
                    arrow_drop_down
                </span>
            </div>
        </button>
    );
}
