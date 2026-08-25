
export default function Input({
  label,
  id,
  type = 'text',
  error,
  helpText,
  className = '',
  required = false,
  ...props
}) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-text-primary mb-1">
          {label} {required && <span className="text-error">*</span>}
        </label>
      )}
      <input
        type={type}
        id={id}
        required={required}
        className={`block w-full appearance-none rounded-lg border px-3 py-2.5 bg-card text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm ${
          error ? 'border-error focus:ring-error/20 focus:border-error' : 'border-border'
        }`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-error font-medium">{error}</p>}
      {!error && helpText && <p className="mt-1 text-xs text-text-secondary">{helpText}</p>}
    </div>
  );
}
