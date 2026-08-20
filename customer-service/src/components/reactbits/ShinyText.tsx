import React from 'react'

interface ShinyTextProps {
  text: string
  disabled?: boolean
  speed?: number
  className?: string
}

export const ShinyText: React.FC<ShinyTextProps> = ({
  text,
  disabled = false,
  speed = 4,
  className = '',
}) => {
  const animationDuration = `${speed}s`

  return (
    <span
      className={`inline-block bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-amber-200 to-amber-600 dark:from-amber-400 dark:via-yellow-100 dark:to-amber-400 ${
        disabled ? '' : 'animate-shine'
      } ${className}`}
      style={{
        backgroundImage:
          'linear-gradient(120deg, rgba(197,160,89,0.8) 0%, rgba(255,255,255,1) 50%, rgba(197,160,89,0.8) 100%)',
        backgroundSize: '200% 100%',
        animationDuration,
      }}
    >
      {text}
    </span>
  )
}

export default ShinyText
