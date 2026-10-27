// utils/notifications.js
import { Platform, Alert } from "react-native";

let Notifications = null;
let isAvailable = false;

// Try to load expo-notifications safely
try {
  Notifications = require("expo-notifications");
  isAvailable = true;

  // Only set the handler if the module loaded successfully
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (error) {
  console.log(
    "expo-notifications not fully available in Expo Go:",
    error.message,
  );
  isAvailable = false;
}

/**
 * Ask for permission (safe version)
 */
export async function requestNotificationPermission() {
  if (!isAvailable) {
    return false;
  }

  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return false;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF5A5F",
      });
    }

    return true;
  } catch (error) {
    console.log("Permission error:", error.message);
    return false;
  }
}

/**
 * Schedule a local notification (safe)
 */
export async function scheduleLocalNotification({ title, body, seconds = 5 }) {
  if (!isAvailable) {
    Alert.alert(
      "Notifications Limited",
      "Full notifications require a development build.\n\nYou can continue using the app normally.",
    );
    return;
  }

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    Alert.alert(
      "Permission needed",
      "Please allow notifications for this app.",
    );
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: { seconds },
    });
  } catch (error) {
    console.log("Schedule error:", error.message);
  }
}

/**
 * Check budgets and notify (safe)
 */
export async function checkBudgetsAndNotify(budgets) {
  if (!isAvailable) return;

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  const today = new Date().toISOString().slice(0, 10);
  const sentWarnings = new Set(); // simple in-memory tracker

  for (const budget of budgets) {
    const percentage = budget.percentage || 0;
    const categoryName = budget.category_name || "Category";
    const key80 = `${budget.category_id}-80-${today}`;
    const key100 = `${budget.category_id}-100-${today}`;

    try {
      if (percentage >= 80 && percentage < 100 && !sentWarnings.has(key80)) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Budget Warning ⚠️",
            body: `You have used ${percentage.toFixed(0)}% of your ${categoryName} budget.`,
            sound: true,
          },
          trigger: null,
        });
        sentWarnings.add(key80);
      }

      if (percentage >= 100 && !sentWarnings.has(key100)) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Budget Exceeded 🚨",
            body: `You have exceeded your ${categoryName} budget!`,
            sound: true,
          },
          trigger: null,
        });
        sentWarnings.add(key100);
      }
    } catch (error) {
      console.log("Budget notify error:", error.message);
    }
  }
}
