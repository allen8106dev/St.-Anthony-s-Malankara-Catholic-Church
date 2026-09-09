import { useId } from 'react'

export interface BibleLoaderProps {
  /** Size preset or numeric pixel size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number
  /** Optional loading text displayed below or next to the Bible */
  text?: string
  /** If true, renders as a full-screen centered overlay */
  fullScreen?: boolean
  /** If true, renders inline horizontally with text */
  inline?: boolean
  /** Additional CSS class name */
  className?: string
  /** Accessible label for screen readers */
  ariaLabel?: string
}

const SIZE_MAP: Record<string, { width: number; height: number }> = {
  xs: { width: 36, height: 26 },
  sm: { width: 54, height: 38 },
  md: { width: 88, height: 62 },
  lg: { width: 130, height: 92 },
  xl: { width: 180, height: 126 },
}

export function BibleLoader({
  size = 'md',
  text,
  fullScreen = false,
  inline = false,
  className = '',
  ariaLabel,
}: BibleLoaderProps) {
  const rawId = useId().replace(/:/g, '')
  const id = `bible-${rawId}`

  const dims = typeof size === 'number'
    ? { width: size, height: Math.round((size * 70) / 100) }
    : (SIZE_MAP[size] ?? SIZE_MAP.md)

  const label = ariaLabel || text || 'Loading...'

  const svgContent = (
    <svg
      className="bible-loader__svg"
      viewBox="0 0 220 150"
      width={dims.width}
      height={dims.height}
      role="img"
      aria-hidden="true"
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Ambient Ground Shadow */}
        <radialGradient id={`${id}-ground-shadow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#121815" stopOpacity="0.28" />
          <stop offset="60%" stopColor="#121815" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#121815" stopOpacity="0" />
        </radialGradient>

        {/* Cover Leather Gradient */}
        <linearGradient id={`${id}-cover-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#214e43" />
          <stop offset="45%" stopColor="#173b32" />
          <stop offset="100%" stopColor="#0c231e" />
        </linearGradient>

        {/* Gold Trim / Accent */}
        <linearGradient id={`${id}-gold-foil`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f3deb0" />
          <stop offset="40%" stopColor="#d8a862" />
          <stop offset="80%" stopColor="#b77d4c" />
          <stop offset="100%" stopColor="#8d562b" />
        </linearGradient>

        {/* Parchment Left Page */}
        <linearGradient id={`${id}-page-left`} x1="100%" y1="50%" x2="0%" y2="50%">
          <stop offset="0%" stopColor="#e5dbca" />
          <stop offset="12%" stopColor="#f4eee2" />
          <stop offset="85%" stopColor="#fffefb" />
          <stop offset="100%" stopColor="#f7f1e4" />
        </linearGradient>

        {/* Parchment Right Page */}
        <linearGradient id={`${id}-page-right`} x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#e5dbca" />
          <stop offset="12%" stopColor="#f4eee2" />
          <stop offset="85%" stopColor="#fffefb" />
          <stop offset="100%" stopColor="#f7f1e4" />
        </linearGradient>

        {/* Flipping Page Gradient - Recto (Front face) */}
        <linearGradient id={`${id}-page-recto`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ded3be" />
          <stop offset="15%" stopColor="#fbf6ee" />
          <stop offset="85%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f3ebd9" />
        </linearGradient>

        {/* Flipping Page Gradient - Verso (Back face) */}
        <linearGradient id={`${id}-page-verso`} x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#d6c9b3" />
          <stop offset="25%" stopColor="#f7f0e3" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>

        {/* Ribbon Gradient */}
        <linearGradient id={`${id}-ribbon-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b22234" />
          <stop offset="50%" stopColor="#8b1424" />
          <stop offset="100%" stopColor="#630c18" />
        </linearGradient>

        {/* Page Edge Thickness / Gilded Stacks */}
        <linearGradient id={`${id}-gilt-edge`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#dfca9b" />
          <stop offset="50%" stopColor="#bd9658" />
          <stop offset="100%" stopColor="#8f6932" />
        </linearGradient>

        {/* Dynamic Page Flip Shadow */}
        <filter id={`${id}-leaf-shadow`} x="-20%" y="-20%" width="150%" height="150%">
          <feDropShadow dx="-2" dy="4" stdDeviation="3.5" floodColor="#1a2420" floodOpacity="0.32" />
        </filter>
      </defs>

      {/* Ground Ambient Shadow */}
      <ellipse cx="110" cy="128" rx="96" ry="14" fill={`url(#${id}-ground-shadow)`} />

      {/* --- HARDCOVER BASE --- */}
      <g className="bible-cover">
        {/* Left Hardcover */}
        <path
          d="M 18,34 Q 65,30 108,33 L 108,121 Q 65,117 18,122 Q 13,122 13,117 L 13,39 Q 13,34 18,34 Z"
          fill={`url(#${id}-cover-grad)`}
          stroke={`url(#${id}-gold-foil)`}
          strokeWidth="1.2"
        />

        {/* Right Hardcover */}
        <path
          d="M 202,34 Q 155,30 112,33 L 112,121 Q 155,117 202,122 Q 207,122 207,117 L 207,39 Q 207,34 202,34 Z"
          fill={`url(#${id}-cover-grad)`}
          stroke={`url(#${id}-gold-foil)`}
          strokeWidth="1.2"
        />

        {/* Leather Spine Base */}
        <path
          d="M 106,32 Q 110,30 114,32 L 114,121 Q 110,123 106,121 Z"
          fill="#0c231e"
          stroke={`url(#${id}-gold-foil)`}
          strokeWidth="0.8"
        />

        {/* Left Page Edge Stack (Gilded Book Block) */}
        <path
          d="M 19,116 Q 65,112 107,115 L 107,119 Q 65,116 19,120 Z"
          fill={`url(#${id}-gilt-edge)`}
          opacity="0.85"
        />
        {/* Right Page Edge Stack (Gilded Book Block) */}
        <path
          d="M 201,116 Q 155,112 113,115 L 113,119 Q 155,116 201,120 Z"
          fill={`url(#${id}-gilt-edge)`}
          opacity="0.85"
        />
      </g>

      {/* --- STATIONARY PAGES (OPEN SCRIPTURE) --- */}
      <g className="bible-base-pages">
        {/* Left Open Page (Verso) */}
        <path
          d="M 24,37 Q 66,32 108,35 L 108,115 Q 66,111 24,116 Z"
          fill={`url(#${id}-page-left)`}
          stroke="#d9cbba"
          strokeWidth="0.5"
        />

        {/* Right Open Page (Recto) */}
        <path
          d="M 196,37 Q 154,32 112,35 L 112,115 Q 154,111 196,116 Z"
          fill={`url(#${id}-page-right)`}
          stroke="#d9cbba"
          strokeWidth="0.5"
        />

        {/* Center Spine Crease / Depth Shadow */}
        <path
          d="M 107,34 Q 110,33 113,34 L 113,116 Q 110,117 107,116 Z"
          fill="#2b2319"
          opacity="0.35"
        />
      </g>

      {/* --- STATIONARY SCRIPTURE TEXT LINES --- */}
      <g className="bible-text-lines" opacity="0.55">
        {/* Left Page Text Columns */}
        {/* Column 1 */}
        <rect x="34" y="46" width="30" height="2" rx="1" fill="#7a6b57" />
        <rect x="34" y="53" width="28" height="1.8" rx="0.9" fill="#9e8d78" />
        <rect x="34" y="60" width="31" height="1.8" rx="0.9" fill="#9e8d78" />
        <rect x="34" y="67" width="26" height="1.8" rx="0.9" fill="#9e8d78" />
        <rect x="34" y="74" width="29" height="1.8" rx="0.9" fill="#9e8d78" />
        <rect x="34" y="81" width="31" height="1.8" rx="0.9" fill="#9e8d78" />
        <rect x="34" y="88" width="24" height="1.8" rx="0.9" fill="#9e8d78" />
        <rect x="34" y="95" width="29" height="1.8" rx="0.9" fill="#9e8d78" />
        <rect x="34" y="102" width="20" height="1.8" rx="0.9" fill="#9e8d78" />

        {/* Column 2 */}
        <rect x="71" y="46" width="29" height="2" rx="1" fill="#7a6b57" />
        <rect x="71" y="53" width="30" height="1.8" rx="0.9" fill="#9e8d78" />
        <rect x="71" y="60" width="25" height="1.8" rx="0.9" fill="#9e8d78" />
        <rect x="71" y="67" width="31" height="1.8" rx="0.9" fill="#9e8d78" />
        <rect x="71" y="74" width="28" height="1.8" rx="0.9" fill="#9e8d78" />
        <rect x="71" y="81" width="30" height="1.8" rx="0.9" fill="#9e8d78" />
        <rect x="71" y="88" width="26" height="1.8" rx="0.9" fill="#9e8d78" />
        <rect x="71" y="95" width="29" height="1.8" rx="0.9" fill="#9e8d78" />
        <rect x="71" y="102" width="18" height="1.8" rx="0.9" fill="#9e8d78" />

        {/* Right Page Text Columns */}
        {/* Column 1 */}
        <rect x="119" y="46" width="29" height="2" rx="1" fill="#7a6b57" />
        <rect x="119" y="53" width="31" height="1.8" rx="0.9" fill="#9e8d78" />
        <rect x="119" y="60" width="27" height="1.8" rx="0.9" fill="#9e8d78" />
        <rect x="119" y="67" width="30" height="1.8" rx="0.9" fill="#9e8d78" />
        <rect x="119" y="74" width="28" height="1.8" rx="0.9" fill="#9e8d78" />
        <rect x="119" y="81" width="31" height="1.8" rx="0.9" fill="#9e8d78" />
        <rect x="119" y="88" width="25" height="1.8" rx="0.9" fill="#9e8d78" />
        <rect x="119" y="95" width="29" height="1.8" rx="0.9" fill="#9e8d78" />
        <rect x="119" y="102" width="22" height="1.8" rx="0.9" fill="#9e8d78" />

        {/* Column 2 */}
        <rect x="156" y="46" width="30" height="2" rx="1" fill="#7a6b57" />
        <rect x="156" y="53" width="28" height="1.8" rx="0.9" fill="#9e8d78" />
        <rect x="156" y="60" width="31" height="1.8" rx="0.9" fill="#9e8d78" />
        <rect x="156" y="67" width="26" height="1.8" rx="0.9" fill="#9e8d78" />
        <rect x="156" y="74" width="29" height="1.8" rx="0.9" fill="#9e8d78" />
        <rect x="156" y="81" width="31" height="1.8" rx="0.9" fill="#9e8d78" />
        <rect x="156" y="88" width="28" height="1.8" rx="0.9" fill="#9e8d78" />
        <rect x="156" y="95" width="25" height="1.8" rx="0.9" fill="#9e8d78" />
        <rect x="156" y="102" width="19" height="1.8" rx="0.9" fill="#9e8d78" />
      </g>

      {/* --- FLIPPING PAGES (ANIMATED LEAVES) --- */}
      {/* Leaf 3 (Deepest in flip sequence) */}
      <g
        className="bible-leaf bible-leaf--3"
        style={{ transformOrigin: '110px 75px' }}
        filter={`url(#${id}-leaf-shadow)`}
      >
        <path
          d="M 110,35 Q 152,31 195,36 L 195,115 Q 152,110 110,115 Z"
          fill={`url(#${id}-page-recto)`}
          stroke="#d2c4b0"
          strokeWidth="0.6"
        />
        {/* Leaf text lines */}
        <g opacity="0.4">
          <rect x="122" y="49" width="26" height="1.8" rx="0.9" fill="#9e8d78" />
          <rect x="122" y="58" width="28" height="1.8" rx="0.9" fill="#9e8d78" />
          <rect x="122" y="67" width="24" height="1.8" rx="0.9" fill="#9e8d78" />
          <rect x="122" y="76" width="27" height="1.8" rx="0.9" fill="#9e8d78" />
          <rect x="122" y="85" width="25" height="1.8" rx="0.9" fill="#9e8d78" />
          <rect x="122" y="94" width="28" height="1.8" rx="0.9" fill="#9e8d78" />
          <rect x="157" y="49" width="26" height="1.8" rx="0.9" fill="#9e8d78" />
          <rect x="157" y="58" width="28" height="1.8" rx="0.9" fill="#9e8d78" />
          <rect x="157" y="67" width="24" height="1.8" rx="0.9" fill="#9e8d78" />
          <rect x="157" y="76" width="25" height="1.8" rx="0.9" fill="#9e8d78" />
          <rect x="157" y="85" width="27" height="1.8" rx="0.9" fill="#9e8d78" />
          <rect x="157" y="94" width="22" height="1.8" rx="0.9" fill="#9e8d78" />
        </g>
      </g>

      {/* Leaf 2 (Mid flip sequence) */}
      <g
        className="bible-leaf bible-leaf--2"
        style={{ transformOrigin: '110px 75px' }}
        filter={`url(#${id}-leaf-shadow)`}
      >
        <path
          d="M 110,35 Q 152,31 195,36 L 195,115 Q 152,110 110,115 Z"
          fill={`url(#${id}-page-recto)`}
          stroke="#d2c4b0"
          strokeWidth="0.6"
        />
        {/* Leaf text lines */}
        <g opacity="0.4">
          <rect x="122" y="49" width="27" height="1.8" rx="0.9" fill="#9e8d78" />
          <rect x="122" y="58" width="25" height="1.8" rx="0.9" fill="#9e8d78" />
          <rect x="122" y="67" width="28" height="1.8" rx="0.9" fill="#9e8d78" />
          <rect x="122" y="76" width="26" height="1.8" rx="0.9" fill="#9e8d78" />
          <rect x="122" y="85" width="28" height="1.8" rx="0.9" fill="#9e8d78" />
          <rect x="122" y="94" width="23" height="1.8" rx="0.9" fill="#9e8d78" />
          <rect x="157" y="49" width="28" height="1.8" rx="0.9" fill="#9e8d78" />
          <rect x="157" y="58" width="26" height="1.8" rx="0.9" fill="#9e8d78" />
          <rect x="157" y="67" width="27" height="1.8" rx="0.9" fill="#9e8d78" />
          <rect x="157" y="76" width="24" height="1.8" rx="0.9" fill="#9e8d78" />
          <rect x="157" y="85" width="26" height="1.8" rx="0.9" fill="#9e8d78" />
          <rect x="157" y="94" width="20" height="1.8" rx="0.9" fill="#9e8d78" />
        </g>
      </g>

      {/* Leaf 1 (Lead flip sequence) */}
      <g
        className="bible-leaf bible-leaf--1"
        style={{ transformOrigin: '110px 75px' }}
        filter={`url(#${id}-leaf-shadow)`}
      >
        <path
          d="M 110,35 Q 152,31 195,36 L 195,115 Q 152,110 110,115 Z"
          fill={`url(#${id}-page-recto)`}
          stroke="#d2c4b0"
          strokeWidth="0.6"
        />
        {/* Leaf text lines */}
        <g opacity="0.45">
          <rect x="122" y="49" width="28" height="1.8" rx="0.9" fill="#9e8d78" />
          <rect x="122" y="58" width="26" height="1.8" rx="0.9" fill="#9e8d78" />
          <rect x="122" y="67" width="29" height="1.8" rx="0.9" fill="#9e8d78" />
          <rect x="122" y="76" width="25" height="1.8" rx="0.9" fill="#9e8d78" />
          <rect x="122" y="85" width="28" height="1.8" rx="0.9" fill="#9e8d78" />
          <rect x="122" y="94" width="22" height="1.8" rx="0.9" fill="#9e8d78" />
          <rect x="157" y="49" width="27" height="1.8" rx="0.9" fill="#9e8d78" />
          <rect x="157" y="58" width="29" height="1.8" rx="0.9" fill="#9e8d78" />
          <rect x="157" y="67" width="25" height="1.8" rx="0.9" fill="#9e8d78" />
          <rect x="157" y="76" width="28" height="1.8" rx="0.9" fill="#9e8d78" />
          <rect x="157" y="85" width="24" height="1.8" rx="0.9" fill="#9e8d78" />
          <rect x="157" y="94" width="21" height="1.8" rx="0.9" fill="#9e8d78" />
        </g>
      </g>

      {/* --- LITURGICAL SILK BOOKMARK RIBBON --- */}
      <g className="bible-ribbon">
        {/* Upper loop extending from top of spine */}
        <path
          d="M 108,24 Q 110,21 112,24 L 112,34 L 108,34 Z"
          fill={`url(#${id}-ribbon-grad)`}
        />
        {/* Main ribbon flowing down from the spine to below the book */}
        <path
          d="M 108,114 Q 109,122 113,128 Q 116,133 118,140 L 123,138 Q 120,132 117,126 Q 113,120 112,114 Z"
          fill={`url(#${id}-ribbon-grad)`}
        />
        {/* Notched Ribbon Tail (V-cut fishtail end) */}
        <polygon
          points="118,140 123,138 126,145 120.5,143 115,147"
          fill={`url(#${id}-ribbon-grad)`}
        />
        {/* Subtle gold fringe trim at ribbon end */}
        <line x1="115" y1="147" x2="120.5" y2="143" stroke={`url(#${id}-gold-foil)`} strokeWidth="0.8" />
        <line x1="120.5" y1="143" x2="126" y2="145" stroke={`url(#${id}-gold-foil)`} strokeWidth="0.8" />
      </g>

      {/* --- SACRED MALANKARA / CATHOLIC GOLDEN CROSS EMBLEM --- */}
      <g className="bible-cross" transform="translate(110, 29)">
        {/* Soft golden aura */}
        <circle cx="0" cy="0" r="6" fill={`url(#${id}-gold-foil)`} opacity="0.3" />
        {/* Vertical beam */}
        <line x1="0" y1="-5.5" x2="0" y2="5.5" stroke={`url(#${id}-gold-foil)`} strokeWidth="1.6" strokeLinecap="round" />
        {/* Horizontal beam */}
        <line x1="-4" y1="-1.5" x2="4" y2="-1.5" stroke={`url(#${id}-gold-foil)`} strokeWidth="1.6" strokeLinecap="round" />
        {/* Center radiant diamond point */}
        <polygon points="0,-2.5 1,-1.5 0,-0.5 -1,-1.5" fill="#fffef7" />
      </g>
    </svg>
  )

  if (fullScreen) {
    return (
      <div className={`bible-loader-fullscreen ${className}`} role="status" aria-live="polite" aria-label={label}>
        <div className="bible-loader-fullscreen__content">
          <div className="bible-loader-wrapper">{svgContent}</div>
          {text && <p className="bible-loader__text">{text}</p>}
        </div>
      </div>
    )
  }

  if (inline) {
    return (
      <span className={`bible-loader-inline ${className}`} role="status" aria-live="polite" aria-label={label}>
        <span className="bible-loader-wrapper">{svgContent}</span>
        {text && <span className="bible-loader__text">{text}</span>}
      </span>
    )
  }

  return (
    <div className={`bible-loader-block ${className}`} role="status" aria-live="polite" aria-label={label}>
      <div className="bible-loader-wrapper">{svgContent}</div>
      {text && <p className="bible-loader__text">{text}</p>}
    </div>
  )
}

