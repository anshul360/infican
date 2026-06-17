import { Handle, NodeResizer, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { Code2, X } from 'lucide-react'
import { useProjectStore } from '#/store/project'
import { CodeEditor } from '#/editor/CodeEditor'
import type { EditorNode as EditorNodeType } from '#/store/types'

export function EditorNode({ id, data, selected }: NodeProps<EditorNodeType>) {
  const setEditorCode = useProjectStore((s) => s.setEditorCode)
  const removeNode = useProjectStore((s) => s.removeNode)

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900 shadow-lg">
      <NodeResizer
        isVisible={selected}
        minWidth={240}
        minHeight={160}
        lineClassName="!border-sky-500"
        handleClassName="!h-2 !w-2 !rounded-sm !border-sky-500 !bg-neutral-900"
      />
      <div className="drag-handle flex cursor-grab items-center gap-2 border-b border-neutral-700 bg-neutral-800 px-2 py-1 text-xs font-medium text-neutral-200">
        <Code2 className="h-3.5 w-3.5 text-sky-400" />
        <span className="flex-1 truncate">{data.title}</span>
        <button
          className="nodrag rounded p-0.5 text-neutral-400 hover:bg-neutral-700 hover:text-white"
          onClick={() => removeNode(id)}
          title="Delete"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 bg-neutral-950">
        <CodeEditor
          value={data.code}
          onChange={(code) => setEditorCode(id, code)}
        />
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !border-neutral-900 !bg-sky-500"
      />
    </div>
  )
}
