import { Code2, MonitorPlay, Spline, ListTree } from 'lucide-react'

const STEPS = [
  {
    icon: Code2,
    color: 'text-sky-400',
    label: 'Add a Shader',
    desc: 'write TSL code',
  },
  {
    icon: MonitorPlay,
    color: 'text-emerald-400',
    label: 'Add a Preview',
    desc: 'a camera on a plane',
  },
  {
    icon: Spline,
    color: 'text-neutral-300',
    label: 'Connect them',
    desc: 'drag editor → preview',
  },
  {
    icon: ListTree,
    color: 'text-amber-400',
    label: 'Pick a line',
    desc: "see that line's value",
  },
]

/** Shown on an empty canvas to orient first-time users. */
export function EmptyState() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
      <div className="max-w-md rounded-xl border border-neutral-800 bg-neutral-900/70 p-6 text-center backdrop-blur-sm">
        <h2 className="mb-1 text-lg font-semibold text-neutral-100">
          Shader playground
        </h2>
        <p className="mb-5 text-sm text-neutral-400">
          Build, wire, and scrub TSL shaders on an infinite canvas.
        </p>
        <ol className="space-y-3 text-left">
          {STEPS.map((s, i) => (
            <li key={s.label} className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-xs font-medium text-neutral-300">
                {i + 1}
              </span>
              <s.icon className={`h-4 w-4 shrink-0 ${s.color}`} />
              <span className="text-sm text-neutral-200">{s.label}</span>
              <span className="text-xs text-neutral-500">— {s.desc}</span>
            </li>
          ))}
        </ol>
        <p className="mt-5 text-xs text-neutral-500">
          Start with the <span className="text-sky-400">Editor</span> and{' '}
          <span className="text-emerald-400">Preview</span> buttons, top-left.
        </p>
      </div>
    </div>
  )
}
