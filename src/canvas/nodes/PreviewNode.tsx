import { Handle, NodeResizer, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { MonitorPlay, X } from 'lucide-react'
import { useProjectStore } from '#/store/project'
import { useCompileStore } from '#/tsl/compile'
import type {
  MaterialSlot,
  PreviewNode as PreviewNodeType,
} from '#/store/types'

const SLOTS: MaterialSlot[] = [
  'colorNode',
  'emissiveNode',
  'roughnessNode',
  'normalNode',
]

export function PreviewNode({
  id,
  data,
  selected,
}: NodeProps<PreviewNodeType>) {
  const setPreviewSlot = useProjectStore((s) => s.setPreviewSlot)
  const setPreviewLine = useProjectStore((s) => s.setPreviewLine)
  const removeNode = useProjectStore((s) => s.removeNode)
  const entry = useCompileStore((s) =>
    data.sourceEditorId ? s.entries.get(data.sourceEditorId) : undefined,
  )

  const bindings = entry?.result.bindings ?? []
  const error = entry?.result.error ?? null

  // The returned value (final output) may live on its own line (e.g. `return`);
  // expose it as a selectable option too.
  const finalLine = entry?.result.finalLine
  const lineOptions = [...bindings]
  if (finalLine != null && !bindings.some((b) => b.line === finalLine)) {
    lineOptions.push({ name: 'output', line: finalLine })
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900 shadow-lg">
      <NodeResizer
        isVisible={selected}
        minWidth={120}
        minHeight={120}
        keepAspectRatio
        lineClassName="!border-emerald-500"
        handleClassName="!h-2 !w-2 !rounded-sm !border-emerald-500 !bg-neutral-900"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-2 !border-neutral-900 !bg-emerald-500"
      />

      <div className="drag-handle flex cursor-grab items-center gap-1 border-b border-neutral-700 bg-neutral-800 px-2 py-1 text-xs font-medium text-neutral-200">
        <MonitorPlay className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
        {data.sourceEditorId ? (
          <select
            className="nodrag min-w-0 flex-1 rounded border border-neutral-700 bg-neutral-900 px-1 py-0.5 text-[10px] text-neutral-200"
            value={data.line ?? ''}
            onChange={(e) => setPreviewLine(id, Number(e.target.value))}
            title="Line to visualise"
          >
            {lineOptions.length === 0 && <option value="">— no lines —</option>}
            {lineOptions.map((b) => (
              <option key={b.line} value={b.line}>
                {b.name} · L{b.line}
              </option>
            ))}
          </select>
        ) : (
          <span className="flex-1 truncate">{data.title}</span>
        )}
        <select
          className="nodrag shrink-0 rounded border border-neutral-700 bg-neutral-900 px-1 py-0.5 text-[10px] text-neutral-200"
          value={data.materialSlot}
          onChange={(e) => setPreviewSlot(id, e.target.value as MaterialSlot)}
          title="Material slot"
        >
          {SLOTS.map((s) => (
            <option key={s} value={s}>
              {s.replace('Node', '')}
            </option>
          ))}
        </select>
        <button
          className="nodrag shrink-0 rounded p-0.5 text-neutral-400 hover:bg-neutral-700 hover:text-white"
          onClick={() => removeNode(id)}
          title="Delete"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Tracked rect: the WebGPU PreviewLayer renders the shader into this. */}
      <div
        data-preview-id={id}
        className="flex-1 bg-[length:16px_16px] bg-[repeating-conic-gradient(#1a1a1a_0%_25%,#222_0%_50%)]"
      />

      {/* Status bar — outside the tracked rect, so it stays visible. */}
      <div
        className={`truncate border-t border-neutral-700 px-2 py-0.5 text-[10px] ${
          error
            ? 'bg-red-950/70 text-red-300'
            : 'bg-neutral-800 text-neutral-400'
        }`}
      >
        {error
          ? error
          : data.sourceEditorId
            ? `line ${data.line ?? '—'}`
            : 'drag a wire from an editor →'}
      </div>
    </div>
  )
}
