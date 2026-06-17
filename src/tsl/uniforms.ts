import * as THREE from 'three/webgpu'
import { uniform } from 'three/tsl'

/**
 * App-provided uniforms, injected into the TSL sandbox scope. These are shared
 * singletons: the eval engine references them when building node graphs, and
 * the render loop updates their `.value` each frame / per preview.
 *
 * Names here shadow TSL built-ins of the same name (e.g. our controllable
 * `time` replaces TSL's auto-advancing `time`).
 */
export const timeUniform = uniform(0)
export const mouseUniform = uniform(new THREE.Vector2(0.5, 0.5))
export const resolutionUniform = uniform(new THREE.Vector2(1, 1))
export const aspectUniform = uniform(1)

/** Identifiers made available (in addition to all of `three/tsl`). */
export const UNIFORM_SCOPE: Record<string, unknown> = {
  time: timeUniform,
  mouse: mouseUniform,
  resolution: resolutionUniform,
  aspect: aspectUniform,
}

/** Human-readable reference shown in the in-app help. */
export const UNIFORM_REFERENCE: { name: string; type: string; desc: string }[] =
  [
    {
      name: 'time',
      type: 'float',
      desc: 'seconds since start (play/pause/reset)',
    },
    { name: 'mouse', type: 'vec2', desc: 'pointer position in preview, 0–1' },
    { name: 'resolution', type: 'vec2', desc: "preview's pixel size" },
    { name: 'aspect', type: 'float', desc: 'resolution.x / resolution.y' },
  ]

// --- time control ----------------------------------------------------------
let playing = true
let speed = 1

export function isPlaying() {
  return playing
}
export function setPlaying(p: boolean) {
  playing = p
}
export function getSpeed() {
  return speed
}
export function setSpeed(s: number) {
  speed = s
}
export function resetTime() {
  timeUniform.value = 0
}
export function advanceTime(deltaSeconds: number) {
  if (playing) timeUniform.value += deltaSeconds * speed
}
