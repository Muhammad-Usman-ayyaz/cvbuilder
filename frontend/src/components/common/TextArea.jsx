export default function TextArea({
  label,
  id,
  error,
  helpText,
  rows = 4,
  maxLength,
  value = '',
  className = '',
  required = false,
  ...props
}) {
  const charCount = value ? value.length : 0;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-1">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-text-primary">
            {label} {required && <span className="text-error">*</span>}
          </label>
        )}
        {maxLength && (
          <span className="text-xs text-text-secondary">
            {charCount}/{maxLength}
          </span>
        )}
      </div>
      <textarea
        id={id}
        rows={rows}
        maxLength={maxLength}
        value={value}
        required={required}
        className={`block w-full appearance-none rounded-lg border px-3 py-2.5 bg-card text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm resize-y break-words ${error ? 'border-error focus:ring-error/20 focus:border-error' : 'border-border'
          }`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-error font-medium">{error}</p>}
      {!error && helpText && <p className="mt-1 text-xs text-text-secondary">{helpText}</p>}
    </div>
  );
}