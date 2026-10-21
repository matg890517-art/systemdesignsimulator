import { createFileRoute } from '@tanstack/react-router'
import { PlaceholderPage } from '../components/PlaceholderPage.tsx'

export const Route = createFileRoute('/projects')({
  component: () => (
    <PlaceholderPage
      page="projects"
      title="Projects"
      body="Save, load and share topologies after the engine and canvas are proven."
    />
  ),
})
