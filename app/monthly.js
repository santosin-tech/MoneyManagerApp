// app/monthly.js
import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
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

function formatMonthTitle(yearMonth) {
  // yearMonth = "2026-10"
  const [year, month] = yearMonth.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

export default function MonthlyScreen() {
  const router = useRouter();
  const { formatMoney } = useApp();

  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMonthlyData = async () => {
    try {
      const db = await getDatabase();

      // Group transactions by year-month
      const rows = await db.getAllAsync(`
        SELECT 
          substr(date, 1, 7) as year_month,
          type,
          SUM(amount) as total
        FROM transactions
        WHERE date IS NOT NULL AND date != ''
        GROUP BY year_month, type
        ORDER BY year_month DESC
      `);

      // Build a map: { '2026-10': { income: 0, expense: 0 } }
      const map = {};
      (rows || []).forEach((row) => {
        const key = row.year_month;
        if (!map[key]) {
          map[key] = { income: 0, expense: 0 };
        }
        const amount = Number(row.total) || 0;
        if (row.type === "income") {
          map[key].income += amount;
        } else if (row.type === "expense") {
          map[key].expense += amount;
        }
      });

      // Convert to array
      const list = Object.keys(map)
        .sort((a, b) => (a < b ? 1 : -1)) // newest first
        .map((key) => ({
          id: key,
          yearMonth: key,
          income: map[key].income,
          expense: map[key].expense,
          net: map[key].income - map[key].expense,
        }));

      setMonths(list);
    } catch (error) {
      console.log("Monthly load error:", error.message);
      setMonths([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMonthlyData();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadMonthlyData();
  };

  const renderItem = ({ item }) => {
    const netColor = item.net >= 0 ? "#4CAF50" : "#FF5A5F";

    return (
      <Pressable
        style={styles.card}
        onPress={() => {
          // Optional: later we can open a detail of that month
          // For now just visual
        }}>
        <Text style={styles.monthTitle}>
          {formatMonthTitle(item.yearMonth)}
        </Text>

        <View style={styles.row}>
          <Text style={styles.label}>Income</Text>
          <Text style={[styles.value, { color: "#4CAF50" }]}>
            {formatMoney(item.income)}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Expense</Text>
          <Text style={[styles.value, { color: "#FF5A5F" }]}>
            {formatMoney(item.expense)}
          </Text>
        </View>

        <View style={[styles.row, styles.netRow]}>
          <Text style={styles.netLabel}>Net</Text>
          <Text style={[styles.netValue, { color: netColor }]}>
            {formatMoney(item.net)}
          </Text>
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Monthly</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={months}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <Text style={{ color: "#666", fontSize: 15 }}>No data yet</Text>
          </View>
        }
      />
    </SafeAreaView>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#1E1E1E",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  monthTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: {
    color: "#aaa",
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
  },
  netRow: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  netLabel: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  netValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  empty: {
    color: "#666",
    textAlign: "center",
    marginTop: 60,
    fontSize: 15,
  },
});
