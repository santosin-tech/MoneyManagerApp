// app/(tabs)/more.js
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { GlobalStyles } from "../../constants/Styles";
import { useApp } from "../../context/AppContext";
import { Colors } from "../../constants/Colors";

export default function MoreScreen() {
  const router = useRouter();
  const { currency } = useApp();

  const settingsSections = [
    {
      title: "Preferences",
      items: [
        {
          icon: "cash-outline",
          label: "Main Currency",
          value: `${currency?.code || "NGN"} (${currency?.symbol || "₦"})`,
          onPress: () =>
            Alert.alert(
              "Coming Soon",
              "Currency settings will be available later",
            ),
        },
        {
          icon: "moon-outline",
          label: "Dark Mode",
          value: "Enabled",
          onPress: () =>
            Alert.alert("Info", "Dark mode is currently always on"),
        },
        {
          icon: "notifications-outline",
          label: "Test Notification",
          onPress: async () => {
            try {
              const { scheduleLocalNotification } =
                await import("../../utils/notifications");
              await scheduleLocalNotification({
                title: "Money Manager",
                body: "Notifications are working! 🎉",
                seconds: 2,
              });
              Alert.alert("Success", "Test notification scheduled.");
            } catch (error) {
              Alert.alert(
                "Info",
                "Notifications are limited in Expo Go. The rest of the app works normally.",
              );
            }
          },
        },
        {
          icon: "pricetags-outline",
          label: "Manage Categories",
          onPress: () => router.push("/categories"),
        },
        {
          icon: "repeat-outline",
          label: "Recurring Transactions",
          onPress: () => router.push("/recurring"),
        },
        {
          icon: "pie-chart-outline",
          label: "Budgets",
          onPress: () => router.push("/budgets"),
        },
        {
          icon: "bookmark-outline",
          label: "Bookmarks",
          onPress: () => router.push("/bookmarks"),
        },
      ],
    },
    {
      title: "Data & Backup",
      items: [
        {
          icon: "cloud-upload-outline",
          label: "Backup Data",
          onPress: () =>
            Alert.alert(
              "Coming Soon",
              "Backup feature will be available later",
            ),
        },
        {
          icon: "cloud-download-outline",
          label: "Restore Data",
          onPress: () =>
            Alert.alert(
              "Coming Soon",
              "Restore feature will be available later",
            ),
        },
        {
          icon: "document-attach-outline",
          label: "Import from Excel",
          onPress: async () => {
            try {
              Alert.alert(
                "Import Excel",
                "This will import transactions from an Excel file.\nNew accounts and categories will be created automatically if needed.\n\nContinue?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Import",
                    onPress: async () => {
                      const { importTransactionsFromExcel } =
                        await import("../../utils/excelImport");
                      const result = await importTransactionsFromExcel();
                      if (result.cancelled) return;

                      Alert.alert(
                        "Import Complete ✅",
                        `File: ${result.fileName}\n\nTotal rows: ${result.totalRows}\nSuccessfully imported: ${result.successCount}\nSkipped: ${result.skippedCount}`,
                        [{ text: "OK" }],
                      );
                    },
                  },
                ],
              );
            } catch (error) {
              Alert.alert("Error", error.message || "Import failed");
            }
          },
        },
        {
          icon: "download-outline",
          label: "Export to Excel",
          onPress: async () => {
            try {
              Alert.alert(
                "Export Transactions",
                "This will create an Excel file with your transactions and open the share menu.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Export",
                    onPress: async () => {
                      const { exportTransactionsToExcel } =
                        await import("../../utils/excelExport");
                      const result = await exportTransactionsToExcel();
                      Alert.alert(
                        "Export Complete ✅",
                        `Exported ${result.count} transactions.\nFile: ${result.fileName}`,
                      );
                    },
                  },
                ],
              );
            } catch (error) {
              Alert.alert("Error", error.message || "Export failed");
            }
          },
        },
      ],
    },
    {
      title: "About",
      items: [
        {
          icon: "information-circle-outline",
          label: "App Version",
          value: "1.0.0 (Day 56)",
          onPress: () => {},
        },
        {
          icon: "heart-outline",
          label: "Built with Expo + React Native",
          onPress: () => {},
        },
      ],
    },
    {
      title: "Security",
      items: [
        {
          label: "App Passcode",
          icon: "lock-closed-outline",
          onPress: () => router.push("/set-passcode"),
        },
        {
          label: "Remove Passcode",
          icon: "lock-open-outline",
          color: "#FF5A5F",
          onPress: () => {
            Alert.alert(
              "Remove Passcode?",
              "The app will no longer ask for a passcode when it opens.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Remove",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      const { removePasscode } =
                        await import("../../utils/passcode");
                      await removePasscode();
                      Alert.alert("Done", "Passcode has been removed.");
                    } catch (error) {
                      console.log("Remove passcode error:", error.message);
                      Alert.alert("Error", "Could not remove passcode.");
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    },
    {
      title: "Data",
      items: [
        {
          label: "Clear All Transactions",
          icon: "trash-outline",
          color: "#FF5A5F", // red to show it’s dangerous
          onPress: async () => {
            Alert.alert(
              "Clear All Transactions?",
              "This will permanently delete EVERY transaction and reset all account balances to ₦0.\n\nThis action cannot be undone.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete Everything",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      const { clearAllTransactions } =
                        await import("../../database/helpers");
                      await clearAllTransactions();

                      // Refresh global data if available
                      if (typeof refreshAccounts === "function") {
                        await refreshAccounts();
                      }

                      Alert.alert(
                        "Done",
                        "All transactions have been cleared.",
                      );
                    } catch (error) {
                      console.log("Clear error:", error.message);
                      Alert.alert("Error", "Could not clear transactions.");
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    },
  ];

  return (
    <View style={GlobalStyles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>More</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {settingsSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>

            <View style={styles.sectionCard}>
              {section.items.map((item, index) => (
                <Pressable
                  key={item.label}
                  style={[
                    styles.settingItem,
                    index === section.items.length - 1 && {
                      borderBottomWidth: 0,
                    },
                  ]}
                  onPress={item.onPress}>
                  <View style={styles.settingLeft}>
                    <View style={styles.iconContainer}>
                      <Ionicons
                        name={item.icon}
                        size={20}
                        color={Colors.primary}
                      />
                    </View>
                    <Text style={styles.settingLabel}>{item.label}</Text>
                  </View>

                  <View style={styles.settingRight}>
                    {item.value ? (
                      <Text style={styles.settingValue}>{item.value}</Text>
                    ) : null}
                    <Ionicons name="chevron-forward" size={18} color="#666" />
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#888",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 4,
    textTransform: "uppercase",
  },
  sectionCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 14,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#2A2A2A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingLabel: {
    color: "#fff",
    fontSize: 15,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingValue: {
    color: "#888",
    fontSize: 14,
    marginRight: 6,
  },
});
