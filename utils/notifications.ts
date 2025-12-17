import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Notification IDs for cancellation
const DAILY_REMINDER_ID = "daily-focus-reminder";
const WEEKLY_RESET_ID = "weekly-goal-reset";
const SESSION_COMPLETE_ID = "session-complete";

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    // Suppress all notifications when app is in foreground
    // User is actively using the app, so notifications are not needed
    return {
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: false,
      shouldShowList: false,
    };
  },
});

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Notification permissions not granted");
    return false;
  }

  // Android needs a notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Petly Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FE534B",
    });
  }

  return true;
}

/**
 * Schedule daily focus/streak reminder at 3pm local time
 * Assumes permissions are already granted (caller should check first)
 * - If streak is 0: "Time to start your focus journey!"
 * - If streak > 0: "Keep your X day streak alive!"
 */
export async function scheduleDailyReminder(streak: number): Promise<void> {
  // Cancel existing daily reminder first
  await cancelDailyReminder();

  const title = streak > 0 ? "🔥 Protect Your Streak!" : "🎯 Time to Focus!";
  const body =
    streak > 0
      ? `Dont lose your ${streak} day streak! Record a focus session today.`
      : "Start your focus journey today!";

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_ID,
    content: {
      title,
      body,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 15, // 3pm
      minute: 0,
    },
  });

  console.log("📅 Daily reminder scheduled for 3:00 PM");
}

/**
 * Cancel daily reminder
 */
export async function cancelDailyReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID);
}

/**
 * Schedule weekly goal reset notification for Monday at 8am local time
 * Assumes permissions are already granted (caller should check first)
 */
export async function scheduleWeeklyResetReminder(): Promise<void> {
  // Cancel existing first
  await cancelWeeklyResetReminder();

  await Notifications.scheduleNotificationAsync({
    identifier: WEEKLY_RESET_ID,
    content: {
      title: "📊 Weekly Goals Reset!",
      body: "A new week begins! Your weekly focus goal has been reset.",
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 2, // Monday (1 = Sunday, 2 = Monday, ...)
      hour: 8,
      minute: 0,
    },
  });

  console.log("📅 Weekly reset reminder scheduled for Monday 8:00 AM");
}

/**
 * Cancel weekly reset reminder
 */
export async function cancelWeeklyResetReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(WEEKLY_RESET_ID);
}

/**
 * Schedule a notification for when focus/rest session completes
 * @param secondsFromNow - seconds until the session ends
 * @param activity - "Focus" or "Rest"
 */
export async function scheduleSessionCompleteNotification(
  secondsFromNow: number,
  activity: "Focus" | "Rest"
): Promise<void> {
  // Cancel any existing session notification first
  await cancelSessionCompleteNotification();

  if (secondsFromNow <= 0) return;

  const title = activity === "Focus" ? "🎉 Focus Session Complete!" : "☕ Rest Session Complete!";
  const body = activity === "Focus" 
    ? "Great work! You've earned coins for your focus time."
    : "Break's over! Ready to focus again?";

  await Notifications.scheduleNotificationAsync({
    identifier: SESSION_COMPLETE_ID,
    content: {
      title,
      body,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: secondsFromNow,
    },
  });

  console.log(`📅 Session complete notification scheduled in ${secondsFromNow}s`);
}

/**
 * Cancel session complete notification (call when session is stopped manually)
 */
export async function cancelSessionCompleteNotification(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(SESSION_COMPLETE_ID);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get all scheduled notifications (for debugging)
 */
export async function getScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}
