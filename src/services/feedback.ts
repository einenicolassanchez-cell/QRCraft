import * as Haptics from 'expo-haptics';

export async function tapFeedback(enabled: boolean) {
  if (!enabled) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Haptics are optional.
  }
}

export async function successFeedback(enabled: boolean) {
  if (!enabled) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Haptics are optional.
  }
}

export async function errorFeedback(enabled: boolean) {
  if (!enabled) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    // Haptics are optional.
  }
}
