import { ClientOnly, createFileRoute } from '@tanstack/react-router'
import { Board } from '#/canvas/Board'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <ClientOnly
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-neutral-950 text-neutral-400">
          Loading…
        </div>
      }
    >
      <Board />
    </ClientOnly>
  )
}
