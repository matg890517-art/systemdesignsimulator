import { Box, Button, Stack, Typography } from '@mui/material'
import { createLink } from '@tanstack/react-router'

export type AppPage =
  | 'workspace'
  | 'results'
  | 'calibration'
  | 'catalog'
  | 'projects'
  | 'learn'

const NavButton = createLink(Button)

const pages: {
  id: AppPage
  label: string
  to: '/' | '/results' | '/calibration' | '/catalog' | '/projects' | '/learn'
}[] = [
  { id: 'workspace', label: 'Workspace', to: '/' },
  { id: 'results', label: 'Results', to: '/results' },
  { id: 'calibration', label: 'Calibration', to: '/calibration' },
  { id: 'catalog', label: 'Catalog', to: '/catalog' },
  { id: 'projects', label: 'Projects', to: '/projects' },
  { id: 'learn', label: 'Learn', to: '/learn' },
]

export function TopNav({ page }: { page: AppPage }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        px: 2,
        height: 52,
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Box
          sx={{
            width: 22,
            height: 22,
            borderRadius: '6px',
            bgcolor: 'primary.main',
          }}
        />
        <Typography sx={{ fontWeight: 600, fontSize: 16 }}>SDS</Typography>
      </Stack>
      <Box sx={{ width: '1px', height: 24, bgcolor: 'divider', flexShrink: 0 }} />
      <Stack direction="row" spacing={0.5}>
        {pages.map((item) => {
          const active = item.id === page
          return (
            <NavButton
              key={item.id}
              to={item.to}
              size="small"
              variant={active ? 'contained' : 'text'}
              sx={{
                px: 1.5,
                color: active ? 'background.paper' : 'text.secondary',
                minWidth: 0,
              }}
            >
              {item.label}
            </NavButton>
          )
        })}
      </Stack>
    </Box>
  )
}
