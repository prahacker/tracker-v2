'use client'

import React, { useState, useEffect } from 'react'

interface DynamicSVGProps {
  width?: number
  height?: number
  children: React.ReactNode
  className?: string
}

export default function DynamicSVG({ width = 24, height = 24, children, className = '' }: DynamicSVGProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}