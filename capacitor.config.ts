import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'in.tpavan.vantagallu',
  appName: 'Vantagallu',
  webDir: 'dist',
  backgroundColor: '#F3F6F2',
  server: { androidScheme: 'https', hostname: 'localhost', cleartext: false },
  android: { allowMixedContent: false, webContentsDebuggingEnabled: false },
  plugins: { SystemBars: { insetsHandling: 'css', initialViewportFitValueHint: 'cover', style: 'LIGHT' } },
}

export default config
