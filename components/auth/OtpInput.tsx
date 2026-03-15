'use client'

import { useRef, useCallback } from 'react'

interface OtpInputProps {
  onChange: (code: string) => void
  disabled?: boolean
}

export function OtpInput({ onChange, disabled }: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  const focusInput = useCallback((index: number) => {
    inputsRef.current[index]?.focus()
  }, [])

  const getCode = useCallback(() => {
    return inputsRef.current.map((el) => el?.value || '').join('')
  }, [])

  const handleInput = useCallback(
    (index: number, value: string) => {
      const digit = value.replace(/\D/g, '').slice(-1)
      const el = inputsRef.current[index]
      if (el) el.value = digit

      if (digit && index < 5) {
        focusInput(index + 1)
      }

      const code = getCode()
      if (code.length === 6) {
        onChange(code)
      }
    },
    [focusInput, getCode, onChange]
  )

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        const el = inputsRef.current[index]
        if (el && !el.value && index > 0) {
          focusInput(index - 1)
        }
      }
    },
    [focusInput]
  )

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault()
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
      pasted.split('').forEach((digit, i) => {
        const el = inputsRef.current[i]
        if (el) el.value = digit
      })
      if (pasted.length === 6) {
        onChange(pasted)
      } else {
        focusInput(Math.min(pasted.length, 5))
      }
    },
    [focusInput, onChange]
  )

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputsRef.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          autoFocus={i === 0}
          className="h-12 w-10 rounded-lg border border-white/[0.08] bg-white/[0.04] text-center text-lg font-semibold text-foreground focus:border-cinema-500 focus:outline-none focus:ring-1 focus:ring-cinema-500 disabled:opacity-50"
          onInput={(e) => handleInput(i, (e.target as HTMLInputElement).value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
        />
      ))}
    </div>
  )
}
