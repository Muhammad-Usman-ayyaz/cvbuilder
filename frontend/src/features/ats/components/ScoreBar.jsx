import { motion } from 'framer-motion';
import Badge from '../../../components/common/Badge';
import { fadeSlideUp } from '../../../lib/motion';
import { scoreTone, priorityBadgeVariant } from '../utils/scoreLabel';

/**
 * A labeled horizontal progress bar for a single score category (0-100),
 * with an optional priority badge. Purely presentational — the caller
 * decides whether it's wrapped in something expandable.
 */
export default function ScoreBar({ label, score, priority }) {
    const tone = scoreTone(score);
    return (
        <motion.div variants={fadeSlideUp} className="flex items-center gap-3">
            <div className="w-40 sm:w-48 shrink-0 flex items-center gap-2">
                <p className="text-sm font-medium text-text-primary truncate">{label}</p>
                {priority && priority !== 'medium' && (
                    <Badge variant={priorityBadgeVariant(priority)} size="sm">
                        {priority}
                    </Badge>
                )}
            </div>
            <div className="flex-1 h-2 rounded-full bg-bg-main overflow-hidden">
                <motion.div
                    className={`h-full rounded-full ${tone.bar}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                />
            </div>
            <span className={`w-10 text-right text-sm font-semibold ${tone.text}`}>{score}%</span>
        </motion.div>
    );
}
