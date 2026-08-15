import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'
import fs from 'node:fs'
import { spawn, type ChildProcess } from 'node:child_process'

function getCloudflaredCmd() {
  const defaultWinPath = 'C:\\Program Files (x86)\\cloudflared\\cloudflared.exe'
  if (process.platform === 'win32' && fs.existsSync(defaultWinPath)) {
    return `"${defaultWinPath}"`
  }
  return 'cloudflared'
}

function cloudflareTunnelPlugin() {
  let tunnelProcess: ChildProcess | null = null

  return {
    name: 'vite-plugin-cloudflare-tunnel',
    configureServer(server: any) {
      server.httpServer?.once('listening', () => {
        const address = server.httpServer?.address()
        if (typeof address === 'object' && address?.port) {
          const port = address.port
          const bin = getCloudflaredCmd()
          tunnelProcess = spawn(bin, ['tunnel', '--url', `http://127.0.0.1:${port}`], {
            shell: true,
          })

          tunnelProcess.stderr?.on('data', (data: Buffer) => {
            const output = data.toString()
            const match = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/)
            if (match) {
              console.log(`\n  \x1b[36m➜\x1b[0m  \x1b[1mTunnel:\x1b[0m   \x1b[36m${match[0]}\x1b[0m\n`)
            }
          })
        }
      })

      const cleanup = () => {
        if (tunnelProcess) {
          tunnelProcess.kill()
          tunnelProcess = null
        }
      }

      process.on('exit', cleanup)
      process.on('SIGINT', cleanup)
      process.on('SIGTERM', cleanup)
    },
  }
}

export default defineConfig({
  plugins: [vue(), cloudflareTunnelPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@components': path.resolve(__dirname, './src/components'),
      '@composables': path.resolve(__dirname, './src/composables'),
      '@layouts': path.resolve(__dirname, './src/layouts'),
      '@modules': path.resolve(__dirname, './src/modules'),
      '@plugins': path.resolve(__dirname, './src/plugins'),
      '@router': path.resolve(__dirname, './src/router'),
      '@services': path.resolve(__dirname, './src/services'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@views': path.resolve(__dirname, './src/views'),
      '~supabase': path.resolve(__dirname, './src/supabase'),
    },
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts: true,
  },
})
