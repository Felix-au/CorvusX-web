import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      // Ignore the CorvusX-application subfolder entirely — it contains
      // a locked .exe in /release and its own separate build system.
      ignored: [
        '**/CorvusX-application/**',
      ],
    },
  },
})
