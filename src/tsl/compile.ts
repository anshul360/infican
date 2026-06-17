import { create } from 'zustand'
import { evaluateTSL } from './evaluate'
import type { EvalResult } from './evaluate'

export type CompileEntry = { result: EvalResult; version: number }

type CompileState = {
  /** editorId -> latest compiled result. */
  entries: Map<string, CompileEntry>
  compile: (editorId: string, code: string) => void
  remove: (editorId: string) => void
}

/**
 * Compiled TSL graphs, keyed by editor. Holds in-memory node graphs (not
 * persisted). The frame loop reads this via getState(); UI reads it reactively.
 */
export const useCompileStore = create<CompileState>((set, get) => ({
  entries: new Map(),
  compile: (editorId, code) => {
    const result = evaluateTSL(code)
    const prev = get().entries.get(editorId)
    const entries = new Map(get().entries)
    entries.set(editorId, { result, version: (prev?.version ?? 0) + 1 })
    set({ entries })
  },
  remove: (editorId) => {
    if (!get().entries.has(editorId)) return
    const entries = new Map(get().entries)
    entries.delete(editorId)
    set({ entries })
  },
}))
