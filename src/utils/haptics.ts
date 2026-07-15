/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Симуляция Taptic Engine / Haptic Feedback Telegram WebApp
export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') {
  // Проверка пользовательских настроек вибрации
  const enabled = localStorage.getItem('dacar_settings_haptics');
  if (enabled === 'false') return;

  // 1. Попытка вызвать оригинальный Telegram SDK haptic
  const tg = (window as any).Telegram?.WebApp;
  // HapticFeedback is supported in Telegram WebApp API 6.1+
  if (tg?.isVersionAtLeast?.('6.1') && tg?.HapticFeedback) {
    switch (type) {
      case 'light':
        tg.HapticFeedback.impactOccurred('light');
        break;
      case 'medium':
        tg.HapticFeedback.impactOccurred('medium');
        break;
      case 'heavy':
        tg.HapticFeedback.impactOccurred('heavy');
        break;
      case 'success':
        tg.HapticFeedback.notificationOccurred('success');
        break;
      case 'warning':
        tg.HapticFeedback.notificationOccurred('warning');
        break;
      case 'error':
        tg.HapticFeedback.notificationOccurred('error');
        break;
    }
    return;
  }

  // 2. Fallback на стандартный HTML5 Vibration API (если поддерживается устройством)
  if ('vibrate' in navigator) {
    try {
      switch (type) {
        case 'light':
          navigator.vibrate(15);
          break;
        case 'medium':
          navigator.vibrate(30);
          break;
        case 'heavy':
          navigator.vibrate(60);
          break;
        case 'success':
          navigator.vibrate([30, 50, 30]);
          break;
        case 'warning':
          navigator.vibrate([60, 100]);
          break;
        case 'error':
          navigator.vibrate([80, 50, 80, 50]);
          break;
      }
    } catch (e) {
      // Игнорируем ошибки безопасности в некоторых браузерах/айфреймах
    }
  }
}
