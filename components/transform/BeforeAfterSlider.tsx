'use client'

import { useState, useRef } from 'react'

interface Props {
  beforeUrl: string
  afterUrl: string
}

export function BeforeAfterSlider({ beforeUrl, afterUrl }: Props) {
  const [position, setPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const updatePosition = (clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * 100
    setPosition(Math.max(2, Math.min(98, x)))
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) updatePosition(e.clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    updatePosition(e.touches[0].clientX)
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-2xl overflow-hidden select-none cursor-col-resize"
      style={{ aspectRatio: '4/3' }}
      onMouseMove={handleMouseMove}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onTouchMove={handleTouchMove}
    >
      {/* Before (full) */}
      <img
        src={beforeUrl}
        className="absolute inset-0 w-full h-full object-cover"
        alt="Before"
        draggable={false}
      />

      {/* After (clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img
          src={afterUrl}
          className="w-full h-full object-cover"
          alt="After"
          draggable={false}
        />
      </div>

      {/* Divider */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.4)] pointer-events-none"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 bg-white rounded-full shadow-xl flex items-center justify-center ring-2 ring-white/80">
          <span className="text-gray-700 text-xs font-bold select-none">◄►</span>
        </div>
      </div>

      {/* Labels */}
      <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-lg font-medium">
        Before
      </span>
      <span className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-lg font-medium">
        After
      </span>
    </div>
  )
}
