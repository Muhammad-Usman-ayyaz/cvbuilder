
export default function Input({
  label,
  id,
  type = 'text',
  error,
  helpText,
  className = '',
  required = false,
  rightElement,
  labelRight,
  ...props
}) {
  return (
    <div className={`w-full ${className}`}>
      {(label || labelRight) && (
        <div className="flex items-center justify-between mb-1">
          {label && (
            <label htmlFor={id} className="block text-sm font-medium text-text-primary">
              {label} {required && <span className="text-error">*</span>}
            </label>
          )}
          {labelRight}
        </div>
      )}
      <div className="relative">
        <input
          type={type}
          id={id}
          required={required}
          className={`block w-full appearance-none rounded-md border px-3 py-2 bg-card text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm ${
            rightElement ? 'pr-10' : ''
          } ${error ? 'border-error focus:ring-error/20 focus:border-error' : 'border-border'}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">{rightElement}</div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-error font-medium">{error}</p>}
      {!error && helpText && <p className="mt-1 text-xs text-text-secondary">{helpText}</p>}
    </div>
  );
}
