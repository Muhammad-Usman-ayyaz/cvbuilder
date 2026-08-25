
export default function PageHeader({
  title,
  description,
  actions,
  className = '',
}) {
  return (
    <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 ${className}`}>
      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-text-secondary mt-1 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
