import { create } from 'zustand'
import { addEdge, applyEdgeChanges, applyNodeChanges } from '@xyflow/react'
import type {
  Connection,
  EdgeChange,
  NodeChange,
  Viewport,
  Edge as RFEdge,
} from '@xyflow/react'
import { loadProject, saveProject } from '#/storage/idb'
import { useCompileStore } from '#/tsl/compile'
import { DEFAULT_EDITOR_CODE } from './types'
import type {
  AppNode,
  EditorNode,
  MaterialSlot,
  PreviewNode,
  ProjectDoc,
} from './types'

const DEFAULT_VIEWPORT: Viewport = { x: 0, y: 0, zoom: 1 }

let counter = 0
const newId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${(counter++).toString(36)}`

type ProjectState = {
  nodes: AppNode[]
  edges: RFEdge[]
  viewport: Viewport
  hydrated: boolean

  onNodesChange: (changes: NodeChange<AppNode>[]) => void
  onEdgesChange: (changes: EdgeChange<RFEdge>[]) => void
  onConnect: (conn: Connection) => void
  setViewport: (vp: Viewport) => void

  addEditor: (position: { x: number; y: number }) => void
  addPreview: (position: { x: number; y: number }) => void
  setEditorCode: (id: string, code: string) => void
  setPreviewSlot: (id: string, slot: MaterialSlot) => void
  setPreviewLine: (id: string, line: number) => void
  removeNode: (id: string) => void

  hydrate: () => Promise<void>
}

// --- debounced persistence -------------------------------------------------
let saveTimer: ReturnType<typeof setTimeout> | undefined
function scheduleSave(get: () => ProjectState) {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    const { nodes, edges, viewport } = get()
    const doc: ProjectDoc = {
      id: 'default',
      name: 'Untitled',
      nodes,
      edges,
      viewport,
    }
    void saveProject(doc)
  }, 400)
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  nodes: [],
  edges: [],
  viewport: DEFAULT_VIEWPORT,
  hydrated: false,

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) })
    scheduleSave(get)
  },
  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) })
    scheduleSave(get)
  },
  onConnect: (conn) => {
    // A preview reads from exactly one editor: drop any existing edge into it.
    const filtered = get().edges.filter((e) => e.target !== conn.target)
    const edges = addEdge({ ...conn, animated: true }, filtered)
    // Default the bound line to the editor's final output line.
    const defaultLine = conn.source
      ? useCompileStore.getState().entries.get(conn.source)?.result.finalLine
      : undefined
    const nodes = get().nodes.map((n) =>
      n.id === conn.target && n.type === 'preview'
        ? {
            ...n,
            data: {
              ...n.data,
              sourceEditorId: conn.source,
              line: n.data.line ?? defaultLine ?? undefined,
            },
          }
        : n,
    )
    set({ edges, nodes })
    scheduleSave(get)
  },
  setViewport: (viewport) => {
    set({ viewport })
    scheduleSave(get)
  },

  addEditor: (position) => {
    const node: EditorNode = {
      id: newId('editor'),
      type: 'editor',
      position,
      style: { width: 360, height: 260 },
      data: { title: 'Shader', code: DEFAULT_EDITOR_CODE },
    }
    set({ nodes: [...get().nodes, node] })
    scheduleSave(get)
  },
  addPreview: (position) => {
    const node: PreviewNode = {
      id: newId('preview'),
      type: 'preview',
      position,
      style: { width: 240, height: 240 },
      data: { title: 'Preview', materialSlot: 'colorNode', camera: 'ortho' },
    }
    set({ nodes: [...get().nodes, node] })
    scheduleSave(get)
  },
  setEditorCode: (id, code) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === id && n.type === 'editor'
          ? { ...n, data: { ...n.data, code } }
          : n,
      ),
    })
    scheduleSave(get)
  },
  setPreviewSlot: (id, slot) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === id && n.type === 'preview'
          ? { ...n, data: { ...n.data, materialSlot: slot } }
          : n,
      ),
    })
    scheduleSave(get)
  },
  setPreviewLine: (id, line) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === id && n.type === 'preview'
          ? { ...n, data: { ...n.data, line } }
          : n,
      ),
    })
    scheduleSave(get)
  },
  removeNode: (id) => {
    set({
      nodes: get().nodes.filter((n) => n.id !== id),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id),
    })
    scheduleSave(get)
  },

  hydrate: async () => {
    const doc = await loadProject()
    if (doc) {
      set({
        nodes: doc.nodes,
        edges: doc.edges,
        viewport: doc.viewport,
        hydrated: true,
      })
    } else {
      set({ hydrated: true })
    }
  },
}))

// Dev-only: expose the store for automated UI tests.
if (import.meta.env.DEV && typeof window !== 'undefined') {
  ;(window as unknown as { __projectStore?: unknown }).__projectStore =
    useProjectStore
}
