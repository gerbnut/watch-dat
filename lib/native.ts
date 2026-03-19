import { Capacitor } from '@capacitor/core'

export function isNative() {
  return Capacitor.isNativePlatform()
}

export async function hapticImpact(style: 'light' | 'medium' | 'heavy' = 'medium') {
  if (!isNative()) return
  const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
  const map = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy }
  await Haptics.impact({ style: map[style] })
}

export async function hapticNotification(type: 'success' | 'warning' | 'error' = 'success') {
  if (!isNative()) return
  const { Haptics, NotificationType } = await import('@capacitor/haptics')
  const map = { success: NotificationType.Success, warning: NotificationType.Warning, error: NotificationType.Error }
  await Haptics.notification({ type: map[type] })
}

export async function initNativePlugins() {
  if (!isNative()) return
  const { StatusBar, Style } = await import('@capacitor/status-bar')
  await StatusBar.setStyle({ style: Style.Dark })
  const { SplashScreen } = await import('@capacitor/splash-screen')
  await SplashScreen.hide()
}
