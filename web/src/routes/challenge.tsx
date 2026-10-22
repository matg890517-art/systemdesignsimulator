import { createFileRoute } from '@tanstack/react-router'
import { ChallengePage } from '../features/challenge/ChallengePage.tsx'

export const Route = createFileRoute('/challenge')({
  ssr: false,
  component: ChallengePage,
})
