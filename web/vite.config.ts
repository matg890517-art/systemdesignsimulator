import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  resolve: {
    tsconfigPaths: true,
    dedupe: ['@emotion/react', '@emotion/styled', 'react', 'react-dom'],
  },
  optimizeDeps: {
    include: [
      '@emotion/react',
      '@emotion/styled',
      '@mui/material',
      '@mui/material/styles',
      '@mui/material/CssBaseline',
      '@xyflow/react',
    ],
  },
  ssr: {
    noExternal: ['@mui/material', '@mui/system', '@emotion/react', '@emotion/styled'],
  },
  plugins: [devtools(), tailwindcss(), tanstackStart(), viteReact()],
  server: {
    host: true
  }
})

export default config
