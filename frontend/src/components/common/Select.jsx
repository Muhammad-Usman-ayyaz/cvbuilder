
export default function Select({
  label,
  id,
  options = [],
  error,
  helpText,
  className = '',
  required = false,
  placeholder = 'Select an option',
  ...props
}) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-text-primary mb-1">
          {label} {required && <span className="text-error">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          required={required}
          className={`block w-full appearance-none rounded-md border px-3 py-2 bg-card text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm pr-10 ${
            error ? 'border-error focus:ring-error/20 focus:border-error' : 'border-border'
          }`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-text-secondary">
          <span className="material-symbols-outlined text-[20px]">expand_more</span>
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-error font-medium">{error}</p>}
      {!error && helpText && <p className="mt-1 text-xs text-text-secondary">{helpText}</p>}
    </div>
  );
}
