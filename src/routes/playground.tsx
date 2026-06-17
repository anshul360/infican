import { createFileRoute, ClientOnly } from '@tanstack/react-router'
import { useMemo, useRef } from 'react'
import * as THREE from 'three/webgpu'
import { uv, vec2, vec3, sin, time, mul, texture } from 'three/tsl'
import { useFrame, useThree } from '@react-three/fiber'
import { WebGPUCanvas } from '#/render/WebGPUCanvas'

export const Route = createFileRoute('/playground')({
  component: PlaygroundRoute,
})

/**
 * Phase 0 de-risk spike — VALIDATED.
 *
 * Findings:
 *  - WebGPURenderer works in r3f v9 via an async `gl` factory (see WebGPUCanvas).
 *  - TSL + MeshStandardNodeMaterial (`colorNode`) renders correctly.
 *  - drei <View> does NOT composite under WebGPU (multiple render() calls per
 *    frame don't blend into one swapchain) — rejected.
 *  - Working approach: render each preview to its own RenderTarget, then draw
 *    all targets as textured quads positioned at their tracked DOM rects in a
 *    single composite pass. One renderer, no per-canvas context limits.
 *  - CRITICAL: GPU objects (RenderTarget, node materials) MUST be created
 *    inside the Canvas/renderer context. Creating them outside yields dead
 *    targets that render black.
 */

type Preview = {
  el: React.RefObject<HTMLDivElement | null>
  scene: THREE.Scene
  camera: THREE.OrthographicCamera
  rt: THREE.RenderTarget
  quad: THREE.Mesh
}

function makePreview(kind: 'uv' | 'wave' | 'rings'): Omit<Preview, 'el'> {
  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
  camera.position.set(0, 0, 2)
  scene.add(new THREE.AmbientLight(0xffffff, 1.4))

  const mat = new THREE.MeshStandardNodeMaterial()
  const p = uv()
  if (kind === 'uv') mat.colorNode = vec3(p.x, p.y, 0.5)
  else if (kind === 'wave')
    mat.colorNode = vec3(sin(mul(p.x, 10).add(time)).mul(0.5).add(0.5), p.y, 1)
  else {
    const d = p.sub(0.5).length()
    mat.colorNode = vec3(sin(mul(d, 40).sub(time)).mul(0.5).add(0.5))
  }
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat))

  const rt = new THREE.RenderTarget(512, 512)
  const quadMat = new THREE.MeshBasicNodeMaterial()
  // RenderTarget textures are Y-flipped relative to DOM space; flip V.
  quadMat.colorNode = texture(rt.texture, vec2(uv().x, uv().y.oneMinus()))
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), quadMat)
  return { scene, camera, rt, quad }
}

function PreviewLayer({
  els,
}: {
  els: React.RefObject<HTMLDivElement | null>[]
}) {
  const gl = useThree((s) => s.gl) as any

  const { previews, compScene, compCam } = useMemo(() => {
    const kinds = ['uv', 'wave', 'rings'] as const
    const items: Preview[] = els.map((el, i) => ({
      el,
      ...makePreview(kinds[i] ?? 'uv'),
    }))
    const scene = new THREE.Scene()
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
    cam.position.set(0, 0, 1)
    items.forEach((p) => scene.add(p.quad))
    return { previews: items, compScene: scene, compCam: cam }
  }, [els])

  useFrame(() => {
    const W = window.innerWidth
    const H = window.innerHeight

    // 1) Render each preview into its own target (isolated WebGPU passes).
    for (const p of previews) {
      const r = p.el.current?.getBoundingClientRect()
      const offscreen =
        !r ||
        r.width === 0 ||
        r.bottom < 0 ||
        r.top > H ||
        r.right < 0 ||
        r.left > W
      if (offscreen) {
        p.quad.visible = false
        continue
      }
      p.quad.visible = true
      gl.setRenderTarget(p.rt)
      gl.render(p.scene, p.camera)

      // Place the composite quad over the tracked rect (NDC, Y flipped).
      const cx = ((r.left + r.width / 2) / W) * 2 - 1
      const cy = -(((r.top + r.height / 2) / H) * 2 - 1)
      p.quad.position.set(cx, cy, 0)
      p.quad.scale.set((r.width / W) * 2, (r.height / H) * 2, 1)
    }

    // 2) Composite every target to the screen in one pass.
    gl.setRenderTarget(null)
    gl.autoClear = true
    gl.render(compScene, compCam)
  }, 1)

  return null
}

function PlaygroundRoute() {
  return (
    <ClientOnly fallback={<div className="p-8">Loading WebGPU…</div>}>
      <Spike />
    </ClientOnly>
  )
}

function Spike() {
  const a = useRef<HTMLDivElement>(null)
  const b = useRef<HTMLDivElement>(null)
  const c = useRef<HTMLDivElement>(null)
  const els = useMemo(() => [a, b, c], [])

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-neutral-900">
      <WebGPUCanvas>
        <PreviewLayer els={els} />
      </WebGPUCanvas>
      <div className="absolute inset-0 flex flex-wrap gap-6 p-6">
        <div ref={a} className="h-64 w-64 rounded border border-neutral-700" />
        <div ref={b} className="h-64 w-64 rounded border border-neutral-700" />
        <div ref={c} className="h-64 w-64 rounded border border-neutral-700" />
      </div>
    </div>
  )
}
