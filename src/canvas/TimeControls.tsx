import { useState } from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'
import { isPlaying, resetTime, setPlaying, setSpeed } from '#/tsl/uniforms'

const SPEEDS = [0.25, 0.5, 1, 2, 4]

export function TimeControls() {
  const [playing, setPlayingState] = useState(isPlaying())
  const [speed, setSpeedState] = useState(1)

  const toggle = () => {
    const next = !playing
    setPlaying(next)
    setPlayingState(next)
  }

  return (
    <div className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-1 rounded-md border border-neutral-700 bg-neutral-800/90 px-1.5 py-1 text-neutral-100 shadow">
      <button
        className="rounded p-1 hover:bg-neutral-700"
        onClick={toggle}
        title={playing ? 'Pause time' : 'Play time'}
      >
        {playing ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4 text-emerald-400" />
        )}
      </button>
      <button
        className="rounded p-1 hover:bg-neutral-700"
        onClick={resetTime}
        title="Reset time to 0"
      >
        <RotateCcw className="h-4 w-4" />
      </button>
      <select
        className="rounded border border-neutral-700 bg-neutral-900 px-1 py-0.5 text-xs"
        value={speed}
        onChange={(e) => {
          const s = Number(e.target.value)
          setSpeed(s)
          setSpeedState(s)
        }}
        title="Time speed"
      >
        {SPEEDS.map((s) => (
          <option key={s} value={s}>
            {s}×
          </option>
        ))}
      </select>
    </div>
  )
}
