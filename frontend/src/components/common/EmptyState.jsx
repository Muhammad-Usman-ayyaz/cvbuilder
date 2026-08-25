import { Link } from 'react-router-dom';
import Button from './Button';

export default function EmptyState({ 
  icon = 'inbox', 
  title = 'No items found', 
  description = 'Get started by creating a new item.',
  actionLabel,
  actionHref,
  actionOnClick
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-border rounded-2xl bg-surface-container-lowest text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-[32px] text-primary">
          {icon}
        </span>
      </div>
      <h3 className="text-xl font-bold text-text-primary mb-2">
        {title}
      </h3>
      <p className="text-sm text-text-secondary max-w-sm mx-auto mb-6">
        {description}
      </p>
      
      {actionLabel && (
        actionHref ? (
          <Link to={actionHref}>
            <Button variant="primary" icon="add">
              {actionLabel}
            </Button>
          </Link>
        ) : (
          <Button variant="primary" icon="add" onClick={actionOnClick}>
            {actionLabel}
          </Button>
        )
      )}
    </div>
  );
}
