interface LogoProps {
  size?: 'sm' | 'lg'
}

export default function Logo({ size = 'sm' }: LogoProps) {
  const isLg = size === 'lg'
  const iconSize = isLg ? 48 : 28
  const titleClass = isLg ? 'text-4xl' : 'text-xl'
  const subtitleClass = isLg ? 'text-sm tracking-[0.2em]' : 'text-[9px] tracking-[0.15em]'

  return (
    <div className="flex items-center gap-2.5">
      {/* Bar chart icon */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="48" height="48" rx="10" fill="#4F7BF7" />
        <rect x="10" y="24" width="7" height="14" rx="2" fill="white" />
        <rect x="20.5" y="16" width="7" height="22" rx="2" fill="white" />
        <rect x="31" y="10" width="7" height="28" rx="2" fill="white" />
      </svg>

      {/* Text */}
      <div className="flex flex-col">
        <span className={`${titleClass} font-bold text-gray-800 leading-none`}>
          scorely
        </span>
        <span className={`${subtitleClass} font-semibold text-gray-400 uppercase leading-tight mt-0.5`}>
          AI Resume Score
        </span>
      </div>
    </div>
  )
}
