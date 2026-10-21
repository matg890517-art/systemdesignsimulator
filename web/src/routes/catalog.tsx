import { createFileRoute } from '@tanstack/react-router'
import { CatalogPage } from '../features/catalog/CatalogPage.tsx'

export const Route = createFileRoute('/catalog')({
  component: CatalogPage,
})
