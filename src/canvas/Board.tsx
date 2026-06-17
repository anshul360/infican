import '@xyflow/react/dist/style.css'
import { useEffect, useRef } from 'react'
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react'
import { Code2, Download, MonitorPlay, Upload } from 'lucide-react'
import { useProjectStore } from '#/store/project'
import { PreviewCanvas } from '#/render/PreviewCanvas'
import { ShaderCompiler } from '#/tsl/ShaderCompiler'
import type { ProjectDoc } from '#/store/types'
import { EditorNode } from './nodes/EditorNode'
import { PreviewNode } from './nodes/PreviewNode'
import { TimeControls } from './TimeControls'
import { UniformsHelp } from './UniformsHelp'
import { EmptyState } from './EmptyState'

const nodeTypes = { editor: EditorNode, preview: PreviewNode }

function Toolbar() {
  const rf = useReactFlow()
  const addEditor = useProjectStore((s) => s.addEditor)
  const addPreview = useProjectStore((s) => s.addPreview)
  const exportDoc = useProjectStore((s) => s.exportDoc)
  const loadDoc = useProjectStore((s) => s.loadDoc)
  const fileInput = useRef<HTMLInputElement>(null)

  const centerish = (dx = 0) => {
    const pos = rf.screenToFlowPosition({
      x: window.innerWidth / 2 + dx,
      y: window.innerHeight / 2,
    })
    return { x: pos.x - 120, y: pos.y - 100 }
  }

  const onExport = () => {
    const blob = new Blob([JSON.stringify(exportDoc(), null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'infican-project.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const onImport = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const doc = JSON.parse(String(reader.result)) as ProjectDoc
        if (Array.isArray(doc.nodes) && Array.isArray(doc.edges)) {
          loadDoc(doc)
          rf.setViewport(doc.viewport)
        }
      } catch {
        /* ignore malformed files */
      }
    }
    reader.readAsText(file)
  }

  const btn =
    'flex items-center gap-1.5 rounded-md border border-neutral-700 bg-neutral-800/90 px-3 py-1.5 text-sm text-neutral-100 shadow hover:bg-neutral-700'

  return (
    <div className="absolute left-3 top-3 z-10 flex gap-2">
      <button className={btn} onClick={() => addEditor(centerish(-320))}>
        <Code2 className="h-4 w-4 text-sky-400" /> Editor
      </button>
      <button className={btn} onClick={() => addPreview(centerish(320))}>
        <MonitorPlay className="h-4 w-4 text-emerald-400" /> Preview
      </button>
      <button className={btn} onClick={onExport} title="Export project as JSON">
        <Download className="h-4 w-4" />
      </button>
      <button
        className={btn}
        onClick={() => fileInput.current?.click()}
        title="Import project JSON"
      >
        <Upload className="h-4 w-4" />
      </button>
      <input
        ref={fileInput}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onImport(f)
          e.target.value = ''
        }}
      />
      <UniformsHelp />
    </div>
  )
}

function BoardInner() {
  const nodes = useProjectStore((s) => s.nodes)
  const edges = useProjectStore((s) => s.edges)
  const viewport = useProjectStore((s) => s.viewport)
  const hydrated = useProjectStore((s) => s.hydrated)
  const onNodesChange = useProjectStore((s) => s.onNodesChange)
  const onEdgesChange = useProjectStore((s) => s.onEdgesChange)
  const onConnect = useProjectStore((s) => s.onConnect)
  const setViewport = useProjectStore((s) => s.setViewport)
  const hydrate = useProjectStore((s) => s.hydrate)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  if (!hydrated) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-neutral-950 text-neutral-400">
        Loading project…
      </div>
    )
  }

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        defaultViewport={viewport}
        onMoveEnd={(_, vp) => setViewport(vp)}
        colorMode="dark"
        minZoom={0.2}
        maxZoom={4}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={24} size={1} color="#333" />
        {nodes.length === 0 && <EmptyState />}
        <Controls />
        <MiniMap
          pannable
          zoomable
          nodeColor={(n) => (n.type === 'editor' ? '#0ea5e9' : '#10b981')}
          maskColor="rgba(0,0,0,0.6)"
          className="!bg-neutral-900"
        />
        <Toolbar />
        <TimeControls />
      </ReactFlow>
      {/* Transparent WebGPU overlay renders each preview onto its node rect. */}
      <PreviewCanvas />
      {/* Recompiles editor TSL on change; feeds previews. */}
      <ShaderCompiler />
    </>
  )
}

export function Board() {
  return (
    <div className="relative h-screen w-screen bg-neutral-950">
      <ReactFlowProvider>
        <BoardInner />
      </ReactFlowProvider>
    </div>
  )
}
