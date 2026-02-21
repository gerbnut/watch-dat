'use client'

import { Component, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

interface Props {
  children: ReactNode
  /** Custom fallback UI. If omitted, renders the default inline error card. */
  fallback?: ReactNode
  /** Label shown in the default fallback (e.g. "feed", "reviews"). */
  label?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error)
  }

  private reset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    if (this.props.fallback) return this.props.fallback

    const label = this.props.label ?? 'section'

    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-6 py-8 text-center">
        <AlertTriangle className="h-5 w-5 text-destructive/70" />
        <p className="text-sm font-medium">
          Couldn&apos;t load the {label}
        </p>
        <button
          onClick={this.reset}
          className="mt-1 flex items-center gap-1.5 text-xs text-cinema-400 hover:underline"
        >
          <RotateCcw className="h-3 w-3" />
          Retry
        </button>
      </div>
    )
  }
}
