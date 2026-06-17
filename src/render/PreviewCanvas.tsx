import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three/webgpu'
import { uv, vec2, vec3, sin, time, texture } from 'three/tsl'
import { useFrame, useThree } from '@react-three/fiber'
import { useProjectStore } from '#/store/project'
import { useCompileStore } from '#/tsl/compile'
import type { MaterialSlot } from '#/store/types'
import { WebGPUCanvas } from './WebGPUCanvas'

type GpuPreview = {
  scene: THREE.Scene
  camera: THREE.OrthographicCamera
  rt: THREE.RenderTarget
  material: THREE.MeshStandardNodeMaterial
  placeholder: ReturnType<typeof vec3>
  quad: THREE.Mesh
  /** Binding signature currently applied to the material. */
  sig: string
}

/** All GPU objects are created here, inside the renderer context. */
function createGpuPreview(): GpuPreview {
  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
  camera.position.set(0, 0, 2)
  scene.add(new THREE.AmbientLight(0xffffff, 1.5))
  scene.add(new THREE.DirectionalLight(0xffffff, 1.2).translateZ(3))

  const material = new THREE.MeshStandardNodeMaterial()
  // Animated placeholder shown until an editor line is wired in.
  const p = uv()
  const placeholder = vec3(p.x, p.y, sin(time).mul(0.5).add(0.5))
  material.colorNode = placeholder
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material))

  const rt = new THREE.RenderTarget(512, 512)
  const quadMat = new THREE.MeshBasicNodeMaterial()
  quadMat.colorNode = texture(rt.texture, vec2(uv().x, uv().y.oneMinus()))
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), quadMat)
  quad.frustumCulled = false
  return { scene, camera, rt, material, placeholder, quad, sig: '' }
}

/**
 * Bind the compiled TSL node for this preview to its chosen material slot.
 * Only called when the binding signature changes (slot assignment triggers a
 * shader recompile, so it must not run every frame).
 */
function applyBinding(
  g: GpuPreview,
  sourceEditorId: string | undefined,
  line: number | null,
  slot: MaterialSlot,
) {
  const mat = g.material as unknown as Record<MaterialSlot, unknown> & {
    colorNode: unknown
    needsUpdate: boolean
  }
  // Reset all slots to defaults.
  mat.colorNode = g.placeholder
  mat.emissiveNode = null
  mat.roughnessNode = null
  mat.normalNode = null

  const entry = sourceEditorId
    ? useCompileStore.getState().entries.get(sourceEditorId)
    : undefined

  if (entry && !entry.result.error) {
    const chosen =
      (line != null ? entry.result.registry.get(line) : undefined) ??
      entry.result.finalNode
    if (chosen) {
      if (slot === 'colorNode') {
        mat.colorNode = chosen
      } else {
        mat.colorNode = vec3(0.015)
        mat[slot] = chosen
      }
    }
  } else if (entry?.result.error) {
    mat.colorNode = vec3(0.35, 0.04, 0.04) // signal compile error
  }
  g.material.needsUpdate = true
}

function disposeGpuPreview(g: GpuPreview) {
  g.rt.dispose()
  g.material.dispose()
  g.quad.geometry.dispose()
  ;(g.quad.material as THREE.Material).dispose()
}

function PreviewRenderer() {
  const gl = useThree((s) => s.gl) as unknown as THREE.WebGPURenderer
  const map = useRef(new Map<string, GpuPreview>())

  const { compScene, compCam } = useMemo(() => {
    const scene = new THREE.Scene()
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
    cam.position.set(0, 0, 1)
    return { compScene: scene, compCam: cam }
  }, [])

  useEffect(() => {
    gl.setClearColor(0x000000, 0) // transparent overlay
  }, [gl])

  useFrame(() => {
    const W = window.innerWidth
    const H = window.innerHeight
    const previews = useProjectStore
      .getState()
      .nodes.filter((n) => n.type === 'preview')
    const seen = new Set<string>()

    const entries = useCompileStore.getState().entries

    for (const node of previews) {
      seen.add(node.id)
      let g = map.current.get(node.id)
      if (!g) {
        g = createGpuPreview()
        map.current.set(node.id, g)
        compScene.add(g.quad)
      }

      // Re-bind the material only when the binding actually changes.
      const editorId = node.data.sourceEditorId
      const line = node.data.line ?? null
      const slot = node.data.materialSlot
      const ver = editorId ? (entries.get(editorId)?.version ?? 0) : 0
      const sig = `${editorId ?? ''}|${ver}|${line}|${slot}`
      if (sig !== g.sig) {
        g.sig = sig
        applyBinding(g, editorId, line, slot)
      }

      const el = document.querySelector<HTMLElement>(
        `[data-preview-id="${node.id}"]`,
      )
      const r = el?.getBoundingClientRect()
      const offscreen =
        !r ||
        r.width === 0 ||
        r.bottom < 0 ||
        r.top > H ||
        r.right < 0 ||
        r.left > W
      if (offscreen) {
        g.quad.visible = false
        continue
      }
      g.quad.visible = true
      gl.setRenderTarget(g.rt)
      gl.render(g.scene, g.camera)

      const cx = ((r.left + r.width / 2) / W) * 2 - 1
      const cy = -(((r.top + r.height / 2) / H) * 2 - 1)
      g.quad.position.set(cx, cy, 0)
      g.quad.scale.set((r.width / W) * 2, (r.height / H) * 2, 1)
    }

    // Dispose previews whose node was removed.
    for (const [id, g] of map.current) {
      if (!seen.has(id)) {
        compScene.remove(g.quad)
        disposeGpuPreview(g)
        map.current.delete(id)
      }
    }

    gl.setRenderTarget(null)
    gl.autoClear = true
    gl.render(compScene, compCam)
  }, 1)

  return null
}

export function PreviewCanvas() {
  // The overlay must never intercept clicks. r3f forces pointer-events:auto on
  // both its container div and the <canvas>, so disable it on all descendants.
  return (
    <div className="pointer-events-none absolute inset-0 [&_*]:!pointer-events-none">
      <WebGPUCanvas>
        <PreviewRenderer />
      </WebGPUCanvas>
    </div>
  )
}
