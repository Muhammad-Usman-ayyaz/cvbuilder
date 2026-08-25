
export default function Card({
  children,
  className = '',
  title,
  subtitle,
  headerActions,
  footer,
  noPadding = false,
  overflowVisible = false,
  ...props
}) {
  return (
    <div
      className={`bg-card border border-border rounded-xl shadow-sm ${overflowVisible ? 'overflow-visible' : 'overflow-hidden'} ${className}`}
      {...props}
    >
      {(title || subtitle || headerActions) && (
        <div className="border-b border-border px-5 py-4 flex items-center justify-between">
          <div>
            {title && <h3 className="text-base font-semibold text-text-primary">{title}</h3>}
            {subtitle && <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>}
          </div>
          {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>
        {children}
      </div>
      {footer && (
        <div className="border-t border-border bg-slate-50/50 px-5 py-4 flex items-center justify-end gap-2">
          {footer}
        </div>
      )}
    </div>
  );
}
