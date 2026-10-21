import { createFileRoute } from '@tanstack/react-router'
import { CalibrationPage } from '../features/calibration/CalibrationPage.tsx'

export const Route = createFileRoute('/calibration')({
  component: CalibrationPage,
})
