import { Chip, Stack, Typography } from '@mui/material'
import { CLASS_FILTERS, type ClassFilter } from './class-filter.ts'

export function ClassFilterChips({
  value,
  onChange,
}: {
  value: ClassFilter
  onChange: (next: ClassFilter) => void
}) {
  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', ml: 'auto', py: 0.5 }}>
      <Typography sx={{ fontSize: 11, color: 'text.secondary', mr: 0.5 }}>Class</Typography>
      {CLASS_FILTERS.map((item) => {
        const selected = value === item.id
        return (
          <Chip
            key={item.id}
            label={item.label}
            size="small"
            onClick={() => onChange(item.id)}
            sx={{
              height: 22,
              fontSize: 11,
              fontWeight: selected ? 600 : 400,
              bgcolor: selected ? 'primary.light' : 'transparent',
              color: selected ? 'primary.dark' : 'text.secondary',
              border: '1px solid',
              borderColor: selected ? 'primary.main' : 'divider',
            }}
          />
        )
      })}
    </Stack>
  )
}
