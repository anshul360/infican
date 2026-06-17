import type { Edge, Node, Viewport } from '@xyflow/react'

export type MaterialSlot =
  | 'colorNode'
  | 'emissiveNode'
  | 'roughnessNode'
  | 'normalNode'

export type EditorData = {
  title: string
  code: string
}

export type PreviewData = {
  title: string
  /** Editor this preview reads from (set when an edge connects them). */
  sourceEditorId?: string
  /** 1-based line in the editor whose value is visualised. */
  line?: number
  materialSlot: MaterialSlot
  camera: 'ortho' | 'persp'
}

export type EditorNode = Node<EditorData, 'editor'>
export type PreviewNode = Node<PreviewData, 'preview'>
export type AppNode = EditorNode | PreviewNode

export type ProjectDoc = {
  id: string
  name: string
  nodes: AppNode[]
  edges: Edge[]
  viewport: Viewport
}

export const DEFAULT_EDITOR_CODE = `// TSL fragment graph. Each line builds a node;
// connect a preview to a line to visualise its value.
const p = uv()
const wave = sin(p.x.mul(10).add(time))
const color = vec3(wave.mul(0.5).add(0.5), p.y, 1.0)
return color
`
