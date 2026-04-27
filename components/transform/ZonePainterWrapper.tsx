'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'

// Fabric.js requires a DOM environment — must not run on the server
const ZonePainter = dynamic(() => import('./ZonePainter'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-gray-500">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#046288] rounded-full animate-spin" />
        <span className="text-sm font-medium">Loading editor…</span>
      </div>
    </div>
  ),
})

export default function ZonePainterWrapper(props: ComponentProps<typeof ZonePainter>) {
  return <ZonePainter {...props} />
}
