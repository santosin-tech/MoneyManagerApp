// app/budgets.js
import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/Colors";
import { useApp } from "../context/AppContext";
import { getDatabase } from "../database/db";

export default function BudgetsScreen() {
  const router = useRouter();
  const { formatMoney } = useApp();

  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const currentMonth = new Date().toISOString().slice(0, 7);

  const loadBudgets = async () => {
    try {
      const db = await getDatabase();

      // Get all budgets for current month
      const budgetRows = await db.getAllAsync(
        `
        SELECT b.*, c.name as category_name
        FROM budgets b
        LEFT JOIN categories c ON b.category_id = c.id
        WHERE b.month = ?
        ORDER BY b.amount DESC
      `,
        currentMonth,
      );

      // Calculate spent amount for each budget
      const enriched = [];
      for (const budget of budgetRows) {
        const spentResult = await db.getFirstAsync(
          `
          SELECT COALESCE(SUM(amount), 0) as total
          FROM transactions
          WHERE category_id = ?
            AND type = 'expense'
            AND date LIKE ?
        `,
          budget.category_id,
          `${currentMonth}%`,
        );

        const spent = Number(spentResult?.total || 0);
        const remaining = budget.amount - spent;
        const percentage =
          budget.amount > 0 ? Math.min((spent / budget.amount) * 100, 100) : 0;

        enriched.push({
          ...budget,
          spent,
          remaining,
          percentage,
        });
      }

      setBudgets(enriched);
      try {
        const { checkBudgetsAndNotify } =
          await import("../utils/notifications");
        await checkBudgetsAndNotify(enriched);
      } catch (e) {
        console.log("Notification check skipped:", e.message);
      }
    } catch (error) {
      console.log("Error loading budgets:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadBudgets();
    }, []),
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Budgets</Text>
        <Pressable
          onPress={() => router.push("/add-budget")}
          style={styles.addButton}>
          <Ionicons name="add" size={26} color="#fff" />
        </Pressable>
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
              onRefresh={() => {
                setRefreshing(true);
                loadBudgets();
              }}
              tintColor={Colors.primary}
            />
          }>
          <Text style={styles.monthLabel}>Budgets for {currentMonth}</Text>

          {budgets.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="pie-chart-outline" size={64} color="#444" />
              <Text style={styles.emptyTitle}>No budgets yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the + button to create your first monthly budget
              </Text>
            </View>
          ) : (
            budgets.map((item) => {
              const isOver = item.remaining < 0;
              const progressColor = isOver
                ? "#FF5A5F"
                : item.percentage > 80
                  ? "#FF9800"
                  : "#4CAF50";

              return (
                <Pressable
                  key={item.id}
                  style={styles.card}
                  onPress={() => router.push(`/add-budget?editId=${item.id}`)}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.categoryName}>
                      {item.category_name}
                    </Text>
                    <Text style={styles.budgetAmount}>
                      {formatMoney(item.amount)}
                    </Text>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressBackground}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(item.percentage, 100)}%`,
                          backgroundColor: progressColor,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.cardFooter}>
                    <Text style={styles.spentText}>
                      Spent: {formatMoney(item.spent)}
                    </Text>
                    <Text
                      style={[
                        styles.remainingText,
                        { color: isOver ? "#FF5A5F" : "#4CAF50" },
                      ]}>
                      {isOver ? "Over by " : "Left: "}
                      {formatMoney(Math.abs(item.remaining))}
                    </Text>
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
  container: { flex: 1, backgroundColor: Colors.background },
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
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "600" },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  monthLabel: { color: "#aaa", fontSize: 14, marginBottom: 16 },
  emptyState: { marginTop: 60, alignItems: "center", paddingHorizontal: 40 },
  emptyTitle: { color: "#fff", fontSize: 18, fontWeight: "600", marginTop: 16 },
  emptySubtitle: {
    color: "#888",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#1E1E1E",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryName: { color: "#fff", fontSize: 16, fontWeight: "600" },
  budgetAmount: { color: "#aaa", fontSize: 14 },
  progressBackground: {
    height: 8,
    backgroundColor: "#333",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  spentText: { color: "#aaa", fontSize: 13 },
  remainingText: { fontSize: 13, fontWeight: "600" },
});
