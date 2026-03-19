import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.watchdat.app',
  appName: 'Watch Dat',
  webDir: 'out',
  server: {
    url: 'https://watch-dat-gold.vercel.app',
    cleartext: false,
  },
}

export default config
