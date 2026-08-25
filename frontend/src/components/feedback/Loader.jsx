
export default function Loader({
  fullPage = false,
  message = 'Loading...',
  size = 'md',
  className = '',
}) {
  const spinnerSizes = {
    sm: 'h-6 w-6 stroke-[2.5]',
    md: 'h-10 w-10 stroke-[2]',
    lg: 'h-16 w-16 stroke-[1.5]',
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <svg
        className={`animate-spin text-primary ${spinnerSizes[size]}`}
        fill="none"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {message && <p className="text-sm font-medium text-text-secondary">{message}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-main/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
}
