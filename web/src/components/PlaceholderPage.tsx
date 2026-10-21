import { Box, Typography } from '@mui/material'
import { TopNav, type AppPage } from './TopNav.tsx'

export function PlaceholderPage({
  page,
  title,
  body,
}: {
  page: AppPage
  title: string
  body: string
}) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <TopNav page={page} />
      <Box sx={{ p: 4, maxWidth: 720 }}>
        <Typography variant="h1">{title}</Typography>
        <Typography sx={{ mt: 1, color: 'text.secondary' }}>{body}</Typography>
      </Box>
    </Box>
  )
}
