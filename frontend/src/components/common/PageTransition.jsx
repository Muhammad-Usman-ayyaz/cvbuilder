import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { fadeSlideUp } from '../../lib/motion';

/**
 * Wraps a layout's <Outlet/> so every route rendered through that layout
 * gets a consistent fade+slide-up entrance on navigation, keyed by
 * pathname so switching routes re-triggers the transition (unlike a plain
 * `initial`/`animate` on a static wrapper, which only fires once on the
 * layout's own mount).
 */
export default function PageTransition({ children }) {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={location.pathname}
                variants={fadeSlideUp}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
