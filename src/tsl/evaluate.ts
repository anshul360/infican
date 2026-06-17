import * as acorn from 'acorn'
import * as TSL from 'three/tsl'
import { UNIFORM_SCOPE } from './uniforms'

/** A top-level variable binding the user can wire a preview to. */
export type TslBinding = { name: string; line: number }

export type EvalResult = {
  /** Top-level declarations, in source order. */
  bindings: TslBinding[]
  /** line (1-based) -> TSL node produced on that line. */
  registry: Map<number, unknown>
  /** The node returned by the snippet (the final output). */
  finalNode: unknown | null
  finalLine: number | null
  error: string | null
}

const EMPTY = (error: string | null): EvalResult => ({
  bindings: [],
  registry: new Map(),
  finalNode: null,
  finalLine: null,
  error,
})

/**
 * Evaluate a TSL snippet and capture the node produced on every top-level line.
 *
 * The snippet is plain JS using bare TSL identifiers (uv, vec3, sin, time, …),
 * with each line typically `const name = <expr>` and a final `return <expr>`.
 * We parse it, instrument each declaration with a `__tap(line, value)` call so
 * the resulting node graph is recorded by line, then run it in a sandbox whose
 * scope is the TSL module (via `with`). No type detection is needed: assigning
 * any node to a material slot lets three convert it (float→grey, vec2→rg, …).
 */
export function evaluateTSL(source: string): EvalResult {
  let ast: acorn.Program
  try {
    ast = acorn.parse(source, {
      ecmaVersion: 'latest',
      allowReturnOutsideFunction: true,
      locations: true,
    })
  } catch (e) {
    return EMPTY(`Syntax: ${(e as Error).message}`)
  }

  const bindings: TslBinding[] = []
  let ret: { line: number; start: number; argText: string } | null = null

  for (const stmt of ast.body) {
    if (stmt.type === 'VariableDeclaration') {
      for (const d of stmt.declarations) {
        if (d.id.type === 'Identifier' && d.id.loc) {
          bindings.push({ name: d.id.name, line: d.id.loc.start.line })
        }
      }
    } else if (
      stmt.type === 'ReturnStatement' &&
      stmt.argument &&
      stmt.loc &&
      ret === null
    ) {
      const a = stmt.argument
      ret = {
        line: stmt.loc.start.line,
        start: stmt.start,
        argText: source.slice(a.start, a.end),
      }
    }
  }

  if (bindings.length === 0 && !ret) {
    return EMPTY('No output: declare a value or `return` a node.')
  }

  // Source up to the return (everything after a top-level return is dead code).
  const prefix = ret ? source.slice(0, ret.start) : source
  const taps = bindings.map((b) => `__tap(${b.line}, ${b.name});`).join('\n')

  const last = bindings[bindings.length - 1]
  const finalExpr = ret
    ? `(${ret.argText})`
    : bindings.length
      ? last.name
      : 'null'
  const finalLine = ret ? ret.line : bindings.length ? last.line : null

  const body =
    `${prefix}\n${taps}\n` +
    `return __final(${finalLine ?? 'null'}, ${finalExpr});`

  const registry = new Map<number, unknown>()
  const tap = (line: number, node: unknown) => {
    registry.set(line, node)
    return node
  }
  let finalNode: unknown = null
  let capturedFinalLine: number | null = null
  const final = (line: number | null, node: unknown) => {
    finalNode = node
    capturedFinalLine = line
    if (line != null) registry.set(line, node)
    return node
  }

  try {
    // Sandbox: identifiers resolve via nested `with` (sloppy mode allows it).
    // The inner uniform scope shadows TSL built-ins of the same name (`time`).
    const fn = new Function(
      'TSL',
      'U',
      '__tap',
      '__final',
      `with (TSL) { with (U) {\n${body}\n} }`,
    )
    fn(TSL, UNIFORM_SCOPE, tap, final)
  } catch (e) {
    return {
      bindings,
      registry,
      finalNode: null,
      finalLine: null,
      error: `Eval: ${(e as Error).message}`,
    }
  }

  return {
    bindings,
    registry,
    finalNode,
    finalLine: capturedFinalLine,
    error: null,
  }
}
