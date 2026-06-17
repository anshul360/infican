import { useEffect, useRef } from 'react'
import { useProjectStore } from '#/store/project'
import { useCompileStore } from './compile'

/**
 * Watches editor nodes and (debounced) recompiles each editor's TSL whenever
 * its code changes. Renders nothing.
 */
export function ShaderCompiler() {
  const nodes = useProjectStore((s) => s.nodes)
  const compile = useCompileStore((s) => s.compile)
  const remove = useCompileStore((s) => s.remove)

  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const lastCode = useRef(new Map<string, string>())

  useEffect(() => {
    const editors = nodes.filter((n) => n.type === 'editor')
    const ids = new Set(editors.map((e) => e.id))

    for (const e of editors) {
      const code = e.data.code
      if (lastCode.current.get(e.id) === code) continue
      const firstSight = !lastCode.current.has(e.id)
      lastCode.current.set(e.id, code)
      const existing = timers.current.get(e.id)
      if (existing) clearTimeout(existing)
      if (firstSight) {
        // Compile straight away on hydration / node creation so connected
        // previews render without needing an edit first.
        compile(e.id, code)
      } else {
        timers.current.set(
          e.id,
          setTimeout(() => compile(e.id, code), 150),
        )
      }
    }

    for (const id of [...lastCode.current.keys()]) {
      if (ids.has(id)) continue
      lastCode.current.delete(id)
      const t = timers.current.get(id)
      if (t) clearTimeout(t)
      timers.current.delete(id)
      remove(id)
    }
  }, [nodes, compile, remove])

  useEffect(() => {
    const timersAtMount = timers.current
    return () => {
      for (const t of timersAtMount.values()) clearTimeout(t)
    }
  }, [])

  return null
}
