import { createFileRoute } from '@tanstack/react-router'
import { WorkspacePage } from '../features/workspace/WorkspacePage.tsx'

export const Route = createFileRoute('/')({
  ssr: false,
  component: WorkspacePage,
})
