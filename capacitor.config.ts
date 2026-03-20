import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.watchdat.app',
  appName: 'Watch Dat',
  webDir: 'out',
  server: {
    url: 'https://www.watchdat.xyz',
    cleartext: false,
  },
}

export default config
