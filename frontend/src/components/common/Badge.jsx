
export default function Badge({
  children,
  variant = 'info',
  size = 'md',
  className = '',
  ...props
}) {
  const baseStyles = 'inline-flex items-center font-medium rounded-full';
  
  // Translucent-over-token backgrounds (color/N opacity), not fixed
  // Tailwind palette swatches (bg-green-50 etc.) — those don't adapt under
  // the app's .dark class since only --color-* tokens are redefined there.
  // Matches the pattern already used in AtsResults.jsx's score chips and
  // Sidebar's AI badge (bg-primary/10 text-primary border-primary/20).
  const variants = {
    success: 'bg-success/10 text-success border border-success/20',
    warning: 'bg-warning/10 text-warning border border-warning/20',
    error: 'bg-error/10 text-error border border-error/20',
    info: 'bg-primary/10 text-primary border border-primary/20',
    primary: 'bg-soft-primary text-primary border border-primary/20',
    neutral: 'bg-bg-main text-text-secondary border border-border',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
