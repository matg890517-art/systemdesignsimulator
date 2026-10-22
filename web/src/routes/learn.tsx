import { createFileRoute } from '@tanstack/react-router'
import { LearnPage } from '../features/learn/LearnPage.tsx'

export const Route = createFileRoute('/learn')({
  ssr: false,
  component: LearnPage,
})
