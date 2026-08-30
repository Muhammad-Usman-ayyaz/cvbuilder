/**
 * Shared Framer Motion variants/transitions, so entrance/hover/tap timing
 * stays consistent across the app instead of each component picking its
 * own numbers. Reduced-motion is handled globally via <MotionConfig
 * reducedMotion="user"> in main.jsx — every animation built from these
 * variants (and every whileHover/whileTap prop using the constants below)
 * is automatically disabled for users with that OS setting, so components
 * using these don't need their own prefers-reduced-motion checks.
 */

// Staggered container for card/list grids — each child fades+slides in
// slightly after the previous one. Pair with `fadeSlideUp` on children.
export const staggerContainer = {
    hidden: {},
    show: {
        transition: { staggerChildren: 0.06, delayChildren: 0.04 },
    },
};

export const fadeSlideUp = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
};

export const fadeSlideDown = {
    hidden: { opacity: 0, y: -12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.15, ease: 'easeIn' } },
};

// Fade+scale — used for modals/dialogs and the ATS form<->results swap.
export const fadeScale = {
    hidden: { opacity: 0, scale: 0.96 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 0.97, transition: { duration: 0.15, ease: 'easeIn' } },
};

// Plain fade — used for the modal backdrop.
export const fadeOnly = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.18 } },
    exit: { opacity: 0, transition: { duration: 0.15 } },
};

// Resume/list card exit — used where an item leaves a grid (My Resumes
// delete) so it shrinks/fades out instead of vanishing abruptly.
export const cardExit = {
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2, ease: 'easeIn' } },
};

export const buttonTap = { scale: 0.96 };

export const cardHover = { y: -3, transition: { duration: 0.15, ease: 'easeOut' } };
export const cardTap = { scale: 0.98 };
