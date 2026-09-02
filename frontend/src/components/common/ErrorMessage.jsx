import { motion } from 'framer-motion';
import { fadeSlideDown } from '../../lib/motion';

export default function ErrorMessage({
  title = 'An error occurred',
  message,
  className = '',
  onClose,
  ...props
}) {
  if (!message) return null;

  return (
    <motion.div
      variants={fadeSlideDown}
      initial="hidden"
      animate="show"
      className={`bg-error/10 border border-error/20 rounded-lg p-4 flex gap-3 text-sm text-error ${className}`}
      role="alert"
      {...props}
    >
      <span className="material-symbols-outlined text-[20px] shrink-0 text-error select-none">
        error
      </span>
      <div className="flex-grow">
        {title && <h5 className="font-semibold text-error">{title}</h5>}
        <div className="text-error/90 mt-0.5">{message}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-error hover:text-error/70 transition-colors select-none shrink-0"
          aria-label="Close alert"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      )}
    </motion.div>
  );
}
