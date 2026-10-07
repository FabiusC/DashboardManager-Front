import { useState, useEffect } from 'react'
import { Button } from '@mui/material'
import { useTheme } from '@mui/material/styles'

export default function ScrollToTopButton({ scrollRef }) {
  const theme = useTheme()
  const RADIUS = 19
  const CIRC = parseFloat((2 * Math.PI * RADIUS).toFixed(2))

  const [visible, setVisible] = useState(false)
  const [offset, setOffset] = useState(CIRC)

  useEffect(() => {
    const element = scrollRef.current
    if (!element) return

    const onScroll = () => {
      const scrollTop = element.scrollTop
      const maxScroll = element.scrollHeight - element.clientHeight
      const ratio = maxScroll > 0 ? scrollTop / maxScroll : 0

      setOffset(parseFloat((CIRC * (1 - ratio)).toFixed(2)))
      setVisible(scrollTop > 100)
    }

    element.addEventListener('scroll', onScroll)
    return () => element.removeEventListener('scroll', onScroll)
  }, [scrollRef])

  return (
    <Button
        onClick={() => scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' })}
        variant="contained"
        sx={{
            position: 'fixed',
            bottom: 84,
            right: 16,
            minWidth: 'auto',
            width: 56,
            height: 56,
            borderRadius: '50%',
            padding: 0,
            zIndex: 1000,
            backgroundColor: theme.palette.primary.main,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            opacity: visible ? 1 : 0,
            transform: visible ? 'scale(1) translateY(0)' : 'scale(0.3) translateY(20px)',
            pointerEvents: visible ? 'auto' : 'none',
            animation: visible ? 'fadeInBounce 0.5s ease-out' : 'none',
            '&:hover': {
            backgroundColor: theme.palette.primary.dark,
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
            transform: visible ? 'scale(1.05)' : 'scale(0.3) translateY(20px)',
            },
            transition: 'all 0.2s ease-in-out',
            '@keyframes fadeInBounce': {
            '0%': {
                opacity: 0,
                transform: 'scale(0.3) translateY(20px)'
            },
            '50%': {
                transform: 'scale(1.05)'
            },
            '100%': {
                opacity: 1,
                transform: 'scale(1) translateY(0)'
            }
            }
        }}
        >
        <svg width="44" height="44" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2.5" />
            <circle cx="22" cy="22" r={RADIUS}
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            transform="rotate(-90 22 22)"
            strokeDasharray={CIRC}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.1s linear' }} />
            <polyline points="15,25 22,17 29,25"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none" />
            <line x1="22" y1="17" x2="22" y2="29"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round" />
        </svg>
        </Button>
    )
}