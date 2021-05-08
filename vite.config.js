import {defineConfig} from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'
import rollupPluginCopy from 'rollup-plugin-copy'

// https://vitejs.dev/config/
export default defineConfig({
  // base: './',
  // logLevel:'silent',
  plugins: [reactRefresh()],
  compress: {
    warnings: false,
    drop_debugger: true,
    drop_console: true
  },
})
