'use client'

import { openExternal, isNative } from '@/lib/native'

interface ExternalLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
  children: React.ReactNode
}

export function ExternalLink({ href, children, ...props }: ExternalLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
      onClick={(e) => {
        if (isNative()) {
          e.preventDefault()
          openExternal(href)
        }
      }}
    >
      {children}
    </a>
  )
}
