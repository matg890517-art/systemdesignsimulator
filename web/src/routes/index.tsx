import { createFileRoute } from '@tanstack/react-router'
import { WorkspacePage } from '../features/workspace/WorkspacePage.tsx'

export type WorkspaceSearch = {
  share?: string
  challenge?: string
}

export const Route = createFileRoute('/')({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): WorkspaceSearch => ({
    share: typeof search.share === 'string' ? search.share : undefined,
    challenge: typeof search.challenge === 'string' ? search.challenge : undefined,
  }),
  component: WorkspacePage,
})
