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
      className="group block p-6 bg-card border border-border rounded-xl shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200"
    >
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${colorClass}`}>
        <span className="material-symbols-outlined text-[24px]">
          {icon}
        </span>
      </div>
      <h3 className="text-lg font-bold text-text-primary mb-1 group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-sm text-text-secondary">
        {description}
      </p>
    </MotionLink>
  );
}
