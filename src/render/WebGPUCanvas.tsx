import * as THREE from 'three/webgpu'
import { Canvas, extend } from '@react-three/fiber'
import type { ComponentProps, ReactNode } from 'react'

// Register every three/webgpu export (incl. node materials) as JSX intrinsics.
extend(THREE as any)

type CanvasBaseProps = Omit<ComponentProps<typeof Canvas>, 'gl' | 'children'>

export function WebGPUCanvas({
  children,
  ...props
}: CanvasBaseProps & { children: ReactNode }) {
  return (
    <Canvas
      {...props}
      gl={
        // r3f v9 accepts an async factory for the renderer.
        (async (glProps: any) => {
          const renderer = new THREE.WebGPURenderer({
            ...glProps,
            antialias: true,
            alpha: true,
          })
          await renderer.init()
          return renderer
        }) as any
      }
    >
      {children}
    </Canvas>
  )
}
