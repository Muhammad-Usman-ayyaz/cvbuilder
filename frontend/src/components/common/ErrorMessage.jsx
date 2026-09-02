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
      className={`bg-red-50 border border-red-200 rounded-md p-4 flex gap-3 text-sm text-error ${className}`}
      role="alert"
      {...props}
    >
      <span className="material-symbols-outlined text-[20px] shrink-0 text-red-600 select-none">
        error
      </span>
      <div className="flex-grow">
        {title && <h5 className="font-semibold text-red-800">{title}</h5>}
        <div className="text-red-700 mt-0.5">{message}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-red-600 hover:text-red-800 transition-colors select-none shrink-0"
          aria-label="Close alert"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      )}
    </motion.div>
  );
}
