import { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import { UNIFORM_REFERENCE } from '#/tsl/uniforms'

// A handful of the most useful TSL built-ins (everything in three/tsl is
// available in the editor). These are the common ones for shader practice.
const TSL_BUILTINS: { name: string; desc: string }[] = [
  { name: 'uv()', desc: 'surface coordinates, 0–1' },
  {
    name: 'oscSine(t) / oscTriangle / oscSawtooth / oscSquare',
    desc: 'oscillators',
  },
  { name: 'deltaTime, frameId', desc: 'frame timing' },
  { name: 'screenUV, screenSize', desc: 'full-canvas screen space' },
  { name: 'positionLocal, positionWorld', desc: 'vertex position' },
  { name: 'normalLocal, normalWorld', desc: 'surface normal' },
  { name: 'sin cos abs floor fract mix clamp step smoothstep', desc: 'math' },
  { name: 'vec2 vec3 vec4 float', desc: 'constructors' },
]

export function UniformsHelp() {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        className="flex items-center gap-1.5 rounded-md border border-neutral-700 bg-neutral-800/90 px-3 py-1.5 text-sm text-neutral-100 shadow hover:bg-neutral-700"
        onClick={() => setOpen((o) => !o)}
        title="Available uniforms & TSL helpers"
      >
        <HelpCircle className="h-4 w-4 text-amber-400" /> Uniforms
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 w-80 rounded-lg border border-neutral-700 bg-neutral-900 p-3 text-xs text-neutral-200 shadow-xl">
          <div className="mb-1 font-semibold text-amber-400">App uniforms</div>
          <table className="mb-3 w-full">
            <tbody>
              {UNIFORM_REFERENCE.map((u) => (
                <tr key={u.name} className="align-top">
                  <td className="py-0.5 pr-2 font-mono text-sky-300">
                    {u.name}
                  </td>
                  <td className="py-0.5 pr-2 font-mono text-neutral-500">
                    {u.type}
                  </td>
                  <td className="py-0.5 text-neutral-400">{u.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mb-1 font-semibold text-amber-400">
            Common TSL built-ins
          </div>
          <ul className="space-y-0.5">
            {TSL_BUILTINS.map((b) => (
              <li key={b.name}>
                <span className="font-mono text-sky-300">{b.name}</span>{' '}
                <span className="text-neutral-500">— {b.desc}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 text-[10px] text-neutral-500">
            All of <span className="font-mono">three/tsl</span> is in scope.
          </div>
        </div>
      )}
    </div>
  )
}
