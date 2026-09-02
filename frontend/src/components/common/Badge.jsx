
export default function Badge({
  children,
  variant = 'info',
  size = 'md',
  className = '',
  ...props
}) {
  const baseStyles = 'inline-flex items-center font-medium rounded-md';
  
  const variants = {
    success: 'bg-green-50 text-success border border-green-200',
    warning: 'bg-amber-50 text-warning border border-amber-200',
    error: 'bg-red-50 text-error border border-red-200',
    info: 'bg-blue-50 text-blue-600 border border-blue-200',
    primary: 'bg-soft-primary text-primary border border-primary/20',
    neutral: 'bg-slate-50 text-text-secondary border border-border',
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
