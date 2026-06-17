import { get, set } from 'idb-keyval'
import type { ProjectDoc } from '#/store/types'

const KEY = 'infican:project:default'

export async function loadProject(): Promise<ProjectDoc | undefined> {
  try {
    return await get<ProjectDoc>(KEY)
  } catch {
    return undefined
  }
}

export async function saveProject(doc: ProjectDoc): Promise<void> {
  try {
    await set(KEY, doc)
  } catch {
    // ignore quota / private-mode errors for now
  }
}
