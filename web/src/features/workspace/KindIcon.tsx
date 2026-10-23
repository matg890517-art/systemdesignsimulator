import type { SvgIconComponent } from '@mui/material/SvgIcon'
import AccountTreeOutlined from '@mui/icons-material/AccountTreeOutlined'
import ApiOutlined from '@mui/icons-material/ApiOutlined'
import BoltOutlined from '@mui/icons-material/BoltOutlined'
import ComputerOutlined from '@mui/icons-material/ComputerOutlined'
import CropFreeOutlined from '@mui/icons-material/CropFreeOutlined'
import GridViewOutlined from '@mui/icons-material/GridViewOutlined'
import HexagonOutlined from '@mui/icons-material/HexagonOutlined'
import HubOutlined from '@mui/icons-material/HubOutlined'
import InboxOutlined from '@mui/icons-material/InboxOutlined'
import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined'
import MediationOutlined from '@mui/icons-material/MediationOutlined'
import MemoryOutlined from '@mui/icons-material/MemoryOutlined'
import PeopleOutlined from '@mui/icons-material/PeopleOutlined'
import PrecisionManufacturingOutlined from '@mui/icons-material/PrecisionManufacturingOutlined'
import PublicOutlined from '@mui/icons-material/PublicOutlined'
import StorageOutlined from '@mui/icons-material/StorageOutlined'
import WidgetsOutlined from '@mui/icons-material/WidgetsOutlined'
import type { IconGlyph } from './kind-icon.ts'

const INK = '#131B26'

const ICONS: Record<IconGlyph, SvgIconComponent> = {
  blocks: GridViewOutlined,
  clients: PeopleOutlined,
  lb: AccountTreeOutlined,
  service: WidgetsOutlined,
  cache: MemoryOutlined,
  db: StorageOutlined,
  queue: InboxOutlined,
  worker: PrecisionManufacturingOutlined,
  cdn: PublicOutlined,
  object: Inventory2Outlined,
  compute: ComputerOutlined,
  function: BoltOutlined,
  k8s: HexagonOutlined,
  api: ApiOutlined,
  dns: HubOutlined,
  bus: MediationOutlined,
  zone: CropFreeOutlined,
}

export function KindIcon({
  glyph,
  size,
  title,
}: {
  glyph: IconGlyph
  size: number
  title?: string
}) {
  const Icon = ICONS[glyph]
  return (
    <Icon
      titleAccess={title}
      sx={{ fontSize: size, color: INK, flexShrink: 0 }}
    />
  )
}
