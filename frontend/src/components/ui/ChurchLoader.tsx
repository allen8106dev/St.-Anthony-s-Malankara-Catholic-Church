import type { CSSProperties } from 'react'

export interface ChurchLoaderProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number
  text?: string
  fullScreen?: boolean
  inline?: boolean
  className?: string
  ariaLabel?: string
  progress?: number
}

const sizes = { xs: 36, sm: 54, md: 88, lg: 130, xl: 180 }

export function ChurchLoader({ size = 'md', text, fullScreen = false, inline = false, className = '', ariaLabel, progress }: ChurchLoaderProps) {
  const determinate = progress !== undefined
  const value = Math.max(0, Math.min(100, progress ?? 0))
  return (
    <div className={`church-loader ${fullScreen ? 'church-loader--fullscreen' : ''} ${inline ? 'church-loader--inline' : ''} ${determinate && value === 100 ? 'church-loader--complete' : ''} ${className}`}
      role={determinate ? 'progressbar' : 'status'} aria-label={ariaLabel ?? text ?? 'Loading parish website'}
      aria-valuemin={determinate ? 0 : undefined} aria-valuemax={determinate ? 100 : undefined} aria-valuenow={determinate ? value : undefined}>
      <div className="church-loader__content">
        <div className="church-loader__emblem" style={{ '--loader-size': `${typeof size === 'number' ? size : sizes[size]}px` } as CSSProperties}>
          <img src="/st-anthony-logo.jpg" alt="" width="1024" height="1024" fetchPriority="high" />
          <svg className={`church-loader__ring ${determinate ? '' : 'church-loader__ring--spinning'}`} viewBox="0 0 100 100" aria-hidden="true">
            <circle className="church-loader__track" cx="50" cy="50" r="47" />
            <circle className="church-loader__progress" cx="50" cy="50" r="47" pathLength="100" strokeDasharray="100" strokeDashoffset={100 - (determinate ? value : 25)} />
          </svg>
        </div>
        {(text || determinate) && <div className="church-loader__caption" aria-hidden="true">
          {text && <p>{text}</p>}
          {determinate && <span className="church-loader__percent">{value}%</span>}
        </div>}
      </div>
    </div>
  )
}
