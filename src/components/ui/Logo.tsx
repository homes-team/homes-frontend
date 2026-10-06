function Logo({ className = 'h-[30px] w-[30px]' }: { className?: string }) {
  return (
    <svg className={`text-primary ${className}`} viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" rx="12" fill="currentColor" />
      <path
        d="M13.5 22.5 24 13.5l10.5 9V33a2.5 2.5 0 0 1-2.5 2.5H16a2.5 2.5 0 0 1-2.5-2.5Z"
        fill="none"
        stroke="white"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path d="M20.5 35.5V26h7v9.5" fill="none" stroke="white" strokeWidth="3.5" strokeLinejoin="round" />
    </svg>
  );
}

export default Logo;
