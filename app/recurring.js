// app/recurring.js
import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/Colors";
import { useApp } from "../context/AppContext";
import { getDatabase } from "../database/db";

export default function RecurringScreen() {
  const router = useRouter();
  const { formatMoney } = useApp();

  const [recurringList, setRecurringList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRecurring = async () => {
    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync(`
        SELECT 
          r.*,
          a.name as account_name,
          c.name as category_name
        FROM recurring r
        LEFT JOIN accounts a ON r.account_id = a.id
        LEFT JOIN categories c ON r.category_id = c.id
        WHERE r.is_active = 1
        ORDER BY r.next_date ASC
      `);
      setRecurringList(rows);
    } catch (error) {
      console.log("Error loading recurring:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRecurring();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadRecurring();
  };

  const getFrequencyLabel = (freq) => {
    switch (freq) {
      case "daily":
        return "Every day";
      case "weekly":
        return "Every week";
      case "monthly":
        return "Every month";
      case "yearly":
        return "Every year";
      default:
        return freq;
    }
  };

  const handleRecurringPress = (item) => {
    Alert.alert(
      "Recurring Rule",
      `${item.category_name || item.note || "Transaction"}\n${getFrequencyLabel(item.frequency)}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deactivate",
          style: "destructive",
          onPress: () => deactivateRecurring(item.id),
        },
      ],
    );
  };

  const deactivateRecurring = async (id) => {
    try {
      const db = await getDatabase();
      await db.runAsync(`UPDATE recurring SET is_active = 0 WHERE id = ?`, id);
      // Refresh the list
      loadRecurring();
    } catch (error) {
      console.log("Deactivate error:", error);
      Alert.alert("Error", "Failed to deactivate recurring rule");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Recurring</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }>
          {recurringList.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="repeat-outline" size={64} color="#444" />
              <Text style={styles.emptyTitle}>No recurring transactions</Text>
              <Text style={styles.emptySubtitle}>
                Open any transaction and tap “Make Recurring” to create one.
              </Text>
            </View>
          ) : (
            recurringList.map((item) => {
              const isIncome = item.type === "income";
              const amountColor = isIncome ? "#4CAF50" : "#FF5A5F";

              return (
                <Pressable
                  key={item.id}
                  style={styles.card}
                  onPress={() => handleRecurringPress(item)}>
                  <View style={styles.cardLeft}>
                    <Text style={styles.categoryText}>
                      {item.category_name ||
                        (item.type === "transfer"
                          ? "Transfer"
                          : "Uncategorized")}
                    </Text>
                    <Text style={styles.noteText} numberOfLines={1}>
                      {item.note || item.account_name}
                    </Text>
                    <Text style={styles.metaText}>
                      {getFrequencyLabel(item.frequency)} • Next:{" "}
                      {item.next_date}
                    </Text>
                  </View>

                  <View style={styles.cardRight}>
                    <Text style={[styles.amountText, { color: amountColor }]}>
                      {isIncome ? "+" : "-"}
                      {formatMoney(item.amount)}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color="#666"
                      style={{ marginTop: 4 }}
                    />
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    marginTop: 80,
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtitle: {
    color: "#888",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardLeft: {
    flex: 1,
    marginRight: 12,
  },
  categoryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  noteText: {
    color: "#aaa",
    fontSize: 13,
    marginTop: 3,
  },
  metaText: {
    color: "#666",
    fontSize: 12,
    marginTop: 4,
  },
  amountText: {
    fontSize: 16,
    fontWeight: "700",
  },
  cardRight: {
    alignItems: "flex-end",
  },
});
