import { useRef, useState } from 'react'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { Button, Menu, MenuItem, Typography } from '@mui/material'
import { hotkeyLabel } from './hotkeys.ts'

export function FileMenu({
  onSave,
  onCopyLink,
  onExport,
  onImportFile,
  onInventory,
}: {
  onSave: () => void
  onCopyLink: () => void
  onExport: () => void
  onImportFile: (file: File) => void
  onInventory: () => void
}) {
  const [anchor, setAnchor] = useState<HTMLElement>()
  const inputRef = useRef<HTMLInputElement>(null)

  function close() {
    setAnchor(undefined)
  }

  return (
    <>
      <Button
        variant="outlined"
        endIcon={<KeyboardArrowDownIcon sx={{ fontSize: 16 }} />}
        onClick={(event) => setAnchor(event.currentTarget)}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
      >
        File
      </Button>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={close}
        slotProps={{ list: { dense: true } }}
      >
        <MenuItem
          onClick={() => {
            onSave()
            close()
          }}
          sx={{ gap: 3, justifyContent: 'space-between' }}
        >
          Save
          <Typography component="kbd" sx={{ fontSize: 11, color: 'text.secondary' }}>
            {hotkeyLabel('save')}
          </Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            onCopyLink()
            close()
          }}
        >
          Copy link
        </MenuItem>
        <MenuItem
          onClick={() => {
            onExport()
            close()
          }}
        >
          Export
        </MenuItem>
        <MenuItem
          onClick={() => {
            inputRef.current?.click()
            close()
          }}
        >
          Import
        </MenuItem>
        <MenuItem
          onClick={() => {
            onInventory()
            close()
          }}
        >
          Inventory
        </MenuItem>
      </Menu>
      <input
        ref={inputRef}
        hidden
        type="file"
        accept="application/json,.json,.sds.json"
        aria-label="Import snapshot"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) onImportFile(file)
        }}
      />
    </>
  )
}
