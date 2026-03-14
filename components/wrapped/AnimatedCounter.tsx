'use client'

import { useEffect, useRef } from 'react'
import { useMotionValue, useSpring, motion, useTransform } from 'framer-motion'

interface AnimatedCounterProps {
  value: number
  duration?: number
  className?: string
  formatter?: (n: number) => string
}

export function AnimatedCounter({
  value,
  duration = 1.5,
  className = '',
  formatter,
}: AnimatedCounterProps) {
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, { duration: duration * 1000, bounce: 0 })
  const display = useTransform(springValue, (v) => {
    const rounded = Math.round(v)
    return formatter ? formatter(rounded) : rounded.toLocaleString()
  })
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!hasAnimated.current) {
      hasAnimated.current = true
      motionValue.set(value)
    }
  }, [value, motionValue])

  return <motion.span className={className}>{display}</motion.span>
}
