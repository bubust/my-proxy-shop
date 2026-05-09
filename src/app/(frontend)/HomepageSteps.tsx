'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

type Step = { icon: string; title: string; desc: string }

export default function HomepageSteps({ title, steps }: { title: string; steps: Step[] }) {
  const [open, setOpen] = useState(false)

  if (steps.length === 0) return null

  return (
    <section className="max-w-6xl mx-auto px-4 py-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-[#1a1a1a] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#333] transition-colors"
      >
        {title}
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>

      {open && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {steps.map((step, i) => (
            <div key={i} className="text-center p-4 bg-white rounded-xl border border-gray-100">
              <div className="text-3xl mb-2">{step.icon}</div>
              <div className="font-semibold text-[#1a1a1a] text-sm mb-1">{step.title}</div>
              <div className="text-gray-500 text-xs">{step.desc}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
