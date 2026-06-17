import { useEffect, useRef } from 'react'
import { basicSetup, EditorView } from 'codemirror'
import { Compartment, EditorState, RangeSetBuilder } from '@codemirror/state'
import { Decoration } from '@codemirror/view'
import type { DecorationSet } from '@codemirror/view'
import { javascript } from '@codemirror/lang-javascript'

const darkTheme = EditorView.theme(
  {
    '&': { backgroundColor: 'transparent', color: '#e5e5e5', height: '100%' },
    '.cm-content': {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSize: '11px',
    },
    '.cm-gutters': {
      backgroundColor: '#0a0a0a',
      color: '#525252',
      border: 'none',
    },
    '.cm-activeLine': { backgroundColor: 'rgba(255,255,255,0.04)' },
    '.cm-activeLineGutter': { backgroundColor: 'rgba(255,255,255,0.06)' },
    '&.cm-focused': { outline: 'none' },
    '.cm-scroller': { overflow: 'auto' },
    // Lines wired to a preview.
    '.cm-bound-line': {
      backgroundColor: 'rgba(16,185,129,0.12)',
      boxShadow: 'inset 2px 0 0 #10b981',
    },
  },
  { dark: true },
)

const boundLineClass = Decoration.line({ class: 'cm-bound-line' })

/** Extension highlighting the given 1-based lines; recomputes on doc change. */
function boundLinesExtension(lines: number[]) {
  return EditorView.decorations.compute(['doc'], (state): DecorationSet => {
    const builder = new RangeSetBuilder<Decoration>()
    for (const ln of [...lines].sort((a, b) => a - b)) {
      if (ln >= 1 && ln <= state.doc.lines) {
        builder.add(
          state.doc.line(ln).from,
          state.doc.line(ln).from,
          boundLineClass,
        )
      }
    }
    return builder.finish()
  })
}

export function CodeEditor({
  value,
  onChange,
  boundLines = [],
}: {
  value: string
  onChange: (v: string) => void
  boundLines?: number[]
}) {
  const host = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const initial = useRef(value)
  const marks = useRef(new Compartment())

  useEffect(() => {
    if (!host.current) return
    const view = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: initial.current,
        extensions: [
          basicSetup,
          javascript({ typescript: true }),
          darkTheme,
          marks.current.of(boundLinesExtension(boundLines)),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) onChangeRef.current(u.state.doc.toString())
          }),
        ],
      }),
    })
    viewRef.current = view
    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [])

  // Sync external value changes (hydration, undo from elsewhere).
  useEffect(() => {
    const view = viewRef.current
    if (view && value !== view.state.doc.toString()) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value },
      })
    }
  }, [value])

  // Reconfigure bound-line highlights when the set changes.
  useEffect(() => {
    const view = viewRef.current
    if (view) {
      view.dispatch({
        effects: marks.current.reconfigure(boundLinesExtension(boundLines)),
      })
    }
  }, [boundLines])

  return <div ref={host} className="nodrag nowheel h-full overflow-hidden" />
}
