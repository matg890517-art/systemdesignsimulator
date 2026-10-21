import { createFileRoute } from '@tanstack/react-router'
import { ResultsPage } from '../features/results/ResultsPage.tsx'

export const Route = createFileRoute('/results')({
  component: ResultsPage,
})
