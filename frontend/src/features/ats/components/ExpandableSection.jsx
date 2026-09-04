import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * A collapsible content block used for evidence drill-downs (a score
 * category's explanation, a content issue's detail, etc). Kept generic —
 * `summary` is always visible, `children` only renders while expanded.
 */
export default function ExpandableSection({ summary, children, defaultOpen = false, className = '' }) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className={`border border-border rounded-lg overflow-hidden ${className}`}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left bg-card hover:bg-bg-main transition-colors"
            >
                <div className="min-w-0 flex-1">{summary}</div>
                <span
                    className={`material-symbols-outlined text-text-secondary text-[20px] shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
                >
                    expand_more
                </span>
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 pt-1 border-t border-border">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
