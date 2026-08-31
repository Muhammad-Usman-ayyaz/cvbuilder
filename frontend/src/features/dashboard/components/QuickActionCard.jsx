import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fadeSlideUp, cardHover, cardTap } from '../../../lib/motion';

const MotionLink = motion.create(Link);

export default function QuickActionCard({
  title,
  description,
  icon,
  href,
  colorClass = 'text-primary bg-primary/10'
}) {
  return (
    <MotionLink
      to={href}
      variants={fadeSlideUp}
      whileHover={cardHover}
      whileTap={cardTap}
      className="group block p-6 bg-card border border-border rounded-xl shadow-xs hover:shadow-md hover:border-primary/30 transition-all duration-200"
    >
      {icon && (
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${colorClass}`}>
          <span className="material-symbols-outlined text-[24px]">
            {icon}
          </span>
        </div>
      )}
      <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-1 group-hover:text-[var(--color-primary)] transition-colors">
        {title}
      </h3>
      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
        {description}
      </p>
    </MotionLink>
  );
}
