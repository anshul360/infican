import { evaluateTSL } from './src/tsl/evaluate.ts'

const tests = {
  default: `const p = uv()
const wave = sin(p.x.mul(10).add(time))
const color = vec3(wave.mul(0.5).add(0.5), p.y, 1.0)
return color`,
  noReturn: `const a = uv()
const b = a.x.mul(2)`,
  syntaxErr: `const x = (`,
  evalErr: `const x = notARealTSLFn()
return x`,
}

for (const [name, src] of Object.entries(tests)) {
  const r = evaluateTSL(src)
  console.log('=== ' + name + ' ===')
  console.log('  bindings:', r.bindings.map(b=>`${b.name}@${b.line}`).join(', ') || '(none)')
  console.log('  registry lines:', [...r.registry.keys()].join(', ') || '(none)')
  console.log('  finalLine:', r.finalLine, '| finalNode ctor:', r.finalNode?.constructor?.name ?? null)
  console.log('  error:', r.error)
}
