// app/(tabs)/stats.js
import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { PieChart } from "react-native-chart-kit";
import { Colors } from "../../constants/Colors";
import { useApp } from "../../context/AppContext";
import { getDatabase } from "../../database/db";

const screenWidth = Dimensions.get("window").width;

const chartConfig = {
  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  labelColor: () => "#ccc",
};

// Nice colors for pie slices
const PIE_COLORS = [
  "#FF5A5F",
  "#4CAF50",
  "#64B5F6",
  "#FFB74D",
  "#BA68C8",
  "#4DB6AC",
  "#F06292",
  "#FFD54F",
  "#7986CB",
  "#A1887F",
];

export default function StatsScreen() {
  const { formatMoney } = useApp();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expensePie, setExpensePie] = useState([]);
  const [incomePie, setIncomePie] = useState([]);
  const [totals, setTotals] = useState({
    income: 0,
    expense: 0,
    net: 0,
  });

  const loadStats = async () => {
    try {
      const db = await getDatabase();

      // Current month range
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const start = `${year}-${month}-01`;
      const endDate = new Date(year, now.getMonth() + 1, 0);
      const end = `${year}-${month}-${String(endDate.getDate()).padStart(2, "0")}`;

      // Expense by category
      const expenseRows = await db.getAllAsync(
        `
        SELECT c.name as category, SUM(t.amount) as total
        FROM transactions t
        LEFT JOIN categories c ON c.id = t.category_id
        WHERE t.type = 'expense'
          AND t.date >= ? AND t.date <= ?
        GROUP BY t.category_id
        ORDER BY total DESC
        LIMIT 8
        `,
        [start, end],
      );

      const expenseData = (expenseRows || []).map((row, index) => ({
        name: row.category || "Other",
        amount: Number(row.total) || 0,
        color: PIE_COLORS[index % PIE_COLORS.length],
        legendFontColor: "#ccc",
        legendFontSize: 13,
      }));

      // Income by category
      const incomeRows = await db.getAllAsync(
        `
        SELECT c.name as category, SUM(t.amount) as total
        FROM transactions t
        LEFT JOIN categories c ON c.id = t.category_id
        WHERE t.type = 'income'
          AND t.date >= ? AND t.date <= ?
        GROUP BY t.category_id
        ORDER BY total DESC
        LIMIT 8
        `,
        [start, end],
      );

      const incomeData = (incomeRows || []).map((row, index) => ({
        name: row.category || "Other",
        amount: Number(row.total) || 0,
        color: PIE_COLORS[index % PIE_COLORS.length],
        legendFontColor: "#ccc",
        legendFontSize: 13,
      }));

      // Overall totals for current month
      const totalRows = await db.getAllAsync(
        `
        SELECT type, SUM(amount) as total
        FROM transactions
        WHERE date >= ? AND date <= ?
        GROUP BY type
        `,
        [start, end],
      );

      let income = 0;
      let expense = 0;
      (totalRows || []).forEach((row) => {
        const amount = Number(row.total) || 0;
        if (row.type === "income") income = amount;
        else if (row.type === "expense") expense = amount;
      });

      setExpensePie(expenseData);
      setIncomePie(incomeData);
      setTotals({
        income,
        expense,
        net: income - expense,
      });
    } catch (error) {
      console.log("Stats load error:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const netColor = totals.net >= 0 ? "#4CAF50" : "#FF5A5F";

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Stats</Text>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }>
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Income</Text>
            <Text style={[styles.summaryValue, { color: "#4CAF50" }]}>
              {formatMoney(totals.income)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Expense</Text>
            <Text style={[styles.summaryValue, { color: "#FF5A5F" }]}>
              {formatMoney(totals.expense)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Net</Text>
            <Text style={[styles.summaryValue, { color: netColor }]}>
              {formatMoney(totals.net)}
            </Text>
          </View>
        </View>

        {/* Expense Pie */}
        <Text style={styles.sectionTitle}>Expenses by Category</Text>
        {expensePie.length > 0 ? (
          <PieChart
            data={expensePie}
            width={screenWidth - 16}
            height={220}
            chartConfig={chartConfig}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="12"
            absolute
          />
        ) : (
          <Text style={styles.empty}>No expense data this month</Text>
        )}

        {/* Income Pie */}
        <Text style={styles.sectionTitle}>Income by Category</Text>
        {incomePie.length > 0 ? (
          <PieChart
            data={incomePie}
            width={screenWidth - 16}
            height={220}
            chartConfig={chartConfig}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="12"
            absolute
          />
        ) : (
          <Text style={styles.empty}>No income data this month</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    marginBottom: 20,
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  summaryLabel: {
    color: "#aaa",
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
  },
  empty: {
    color: "#666",
    textAlign: "center",
    marginVertical: 30,
  },
});
