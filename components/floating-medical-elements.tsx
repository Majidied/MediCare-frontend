"use client"

import { useEffect, useState } from "react"

interface FloatingElement {
  id: number
  icon: string
  x: number
  y: number
  delay: number
  duration: number
  size: number
  rotation: number
}

export function FloatingMedicalElements() {
  const [elements, setElements] = useState<FloatingElement[]>([])

  useEffect(() => {
    const medicalIcons = [
      // Stethoscope
      "M19 14a3 3 0 01-3 3H8a3 3 0 01-3-3V9a3 3 0 013-3h8a3 3 0 013 3v5zm-6-3a1 1 0 11-2 0 1 1 0 012 0z",
      // Heart
      "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
      // Medical cross
      "M12 4v16m8-8H4",
      // Pill
      "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
      // DNA
      "M9 2v20M15 2v20M3 12h18M6 6l12 12M6 18l12-12",
      // Syringe
      "M18 2l4 4m-4-4v4m4-4h-4M7 7l10 10m-5-5l-5 5",
    ]

    const newElements: FloatingElement[] = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      icon: medicalIcons[Math.floor(Math.random() * medicalIcons.length)],
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 15 + Math.random() * 10,
      size: 30 + Math.random() * 30,
      rotation: Math.random() * 360,
    }))

    setElements(newElements)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {elements.map((element) => (
        <div
          key={element.id}
          className="absolute opacity-10 dark:opacity-5"
          style={{
            left: `${element.x}%`,
            top: `${element.y}%`,
            animation: `float ${element.duration}s ease-in-out infinite, spin ${element.duration * 2}s linear infinite`,
            animationDelay: `${element.delay}s`,
          }}
        >
          <svg
            className="text-primary"
            width={element.size}
            height={element.size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: `rotate(${element.rotation}deg)` }}
          >
            <path d={element.icon} />
          </svg>
        </div>
      ))}

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0) translateX(0) scale(1);
          }
          25% {
            transform: translateY(-30px) translateX(10px) scale(1.1);
          }
          50% {
            transform: translateY(-50px) translateX(-10px) scale(0.9);
          }
          75% {
            transform: translateY(-30px) translateX(10px) scale(1.05);
          }
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}
