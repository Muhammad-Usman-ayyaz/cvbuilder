import { motion } from 'framer-motion';
import { fadeSlideUp } from '../../../lib/motion';

/**
 * Visual "Create New Resume" card placed directly in the recent resumes grid.
 * Matches the exact height and visual proportions of document cards.
 * Triggers the existing `openCreateResume` modal handler on click.
 */
export default function CreateResumeCard({ onClick }) {
    return (
        <motion.div
            variants={fadeSlideUp}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick();
                }
            }}
            className="group cursor-pointer rounded-xl border-2 border-dashed border-border hover:border-primary/60 dark:hover:border-primary/60 bg-card/40 hover:bg-card dark:bg-card/20 dark:hover:bg-card/50 transition-all p-6 flex flex-col items-center justify-center text-center h-full min-h-[340px] select-none"
        >
            <div className="w-12 h-12 rounded-xl bg-soft-primary text-primary flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-200 shadow-xs">
                <span
                    className="material-symbols-outlined text-[24px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                >
                    auto_awesome
                </span>
            </div>

            <h3 className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">
                Create a new resume
            </h3>

            <p className="text-xs text-text-secondary mt-1 max-w-[190px] leading-relaxed">
                Start from your master profile or choose an ATS-friendly template
            </p>

            <div className="mt-5 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-white text-xs font-bold shadow-xs group-hover:bg-primary-hover group-hover:shadow-sm transition-all">
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Create Resume</span>
            </div>
        </motion.div>
    );
}
