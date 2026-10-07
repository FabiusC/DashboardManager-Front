"use client"

import { useState, useRef, useEffect } from "react"
import { Box, Typography } from "@mui/material"

export const MarqueeText = ({ text, maxWidth = "100%", variant = "body1", ...props }) => {
  const [isHovering, setIsHovering] = useState(false)
  const [needsMarquee, setNeedsMarquee] = useState(false)
  const [textWidth, setTextWidth] = useState(0)
  const [containerWidth, setContainerWidth] = useState(0)

  const textRef = useRef(null)
  const containerRef = useRef(null)

  // Observa los cambios de tamaño y actualiza si es necesario
  useEffect(() => {
    if (!textRef.current || !containerRef.current) return

    const updateWidths = () => {
      const textElementWidth = textRef.current.scrollWidth
      const containerElementWidth = containerRef.current.clientWidth

      setTextWidth(textElementWidth)
      setContainerWidth(containerElementWidth)
      setNeedsMarquee(textElementWidth > containerElementWidth)
    }

    // Inicial
    updateWidths()
    //ResizeObserver se utiliza para observar cambios en el tamaño de los elementos
    const resizeObserver = new ResizeObserver(updateWidths)
    resizeObserver.observe(textRef.current)
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [text])

  const handleMouseEnter = () => {
    setIsHovering(true)
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
  }

  const animationDuration = `${(textWidth / 80) * 1000}ms`

  return (
    <Box
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        maxWidth,
        overflow: "hidden",
        whiteSpace: "nowrap",
        position: "relative",
        width: "100%",
        display: "flex",
        justifyContent: needsMarquee ? "flex-start" : "center",
      }}
    >
      <Typography
        ref={textRef}
        variant={variant}
        className={isHovering && needsMarquee ? "marquee-text-animate" : ""}
        style={{
            animationDuration: animationDuration,
            // Calculamos cuánto debe moverse
            "--translate-amount": `-${textWidth - containerWidth + 20}px`,
        }}
        sx={{
            display: "inline-block",
            whiteSpace: "nowrap",
            overflow: isHovering && needsMarquee ? "visible" : "hidden",
            textOverflow: isHovering && needsMarquee ? "clip" : "ellipsis",
            ...props.sx,
        }}
        {...props}
        >
        {text}
      </Typography>
    </Box>
  )
}
