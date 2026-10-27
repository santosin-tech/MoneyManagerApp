// app/(tabs)/index.js  (or your transactions tab file)
import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";
import { useApp } from "../../context/AppContext";
import { getDatabase } from "../../database/db";

function formatDateHeader(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";

  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

import { parseTransactionText } from "../../utils/aiParser";

console.log(parseTransactionText("spent 2500 on lunch with Opay"));
console.log(parseTransactionText("received 50000 salary into UBA"));
console.log(parseTransactionText("transfer 10000 from Cash to PalmPay"));

export default function TransactionsScreen() {
  const router = useRouter();
  const { formatMoney } = useApp();

  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("All"); // All | Income | Expense | Transfer

  const loadTransactions = async () => {
    try {
      const db = await getDatabase();

      let typeFilter = "";
      if (filter === "Income") typeFilter = `AND t.type = 'income'`;
      if (filter === "Expense") typeFilter = `AND t.type = 'expense'`;
      if (filter === "Transfer") typeFilter = `AND t.type = 'transfer'`;

      const rows = await db.getAllAsync(`
        SELECT 
          t.*,
          a.name as account_name,
          c.name as category_name,
          c.icon as category_icon
        FROM transactions t
        LEFT JOIN accounts a ON a.id = t.account_id
        LEFT JOIN categories c ON c.id = t.category_id
        WHERE 1=1 ${typeFilter}
        ORDER BY t.date DESC, t.id DESC
        LIMIT 300
      `);

      // Group by date
      const grouped = {};
      (rows || []).forEach((tx) => {
        const dateKey = (tx.date || "").split("T")[0] || "Unknown";
        if (!grouped[dateKey]) {
          grouped[dateKey] = {
            title: dateKey,
            data: [],
            income: 0,
            expense: 0,
          };
        }
        grouped[dateKey].data.push(tx);

        const amount = Number(tx.amount) || 0;
        if (tx.type === "income") {
          grouped[dateKey].income += amount;
        } else if (tx.type === "expense") {
          grouped[dateKey].expense += amount;
        }
      });

      const sectionList = Object.keys(grouped)
        .sort((a, b) => (a < b ? 1 : -1)) // newest first
        .map((key) => ({
          title: key,
          data: grouped[key].data,
          income: grouped[key].income,
          expense: grouped[key].expense,
        }));

      setSections(sectionList);
    } catch (error) {
      console.log("Error loading transactions:", error.message);
      setSections([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [filter]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  const renderItem = ({ item }) => {
    const isIncome = item.type === "income";
    const isTransfer = item.type === "transfer";
    const color = isIncome ? "#4CAF50" : isTransfer ? "#64B5F6" : "#FF5A5F";

    return (
      <Pressable
        style={styles.txRow}
        onPress={() => router.push(`/transaction/${item.id}`)}>
        <View style={styles.txLeft}>
          <Text style={styles.txCategory}>
            {item.category_name || item.note || "No category"}
          </Text>
          <Text style={styles.txAccount}>{item.account_name || ""}</Text>
          {item.note ? (
            <Text style={styles.txNote} numberOfLines={1}>
              {item.note}
            </Text>
          ) : null}
        </View>

        <Text style={[styles.txAmount, { color }]}>
          {isIncome ? "+" : isTransfer ? "" : "-"}
          {formatMoney(Math.abs(item.amount))}
        </Text>
      </Pressable>
    );
  };

  const renderSectionHeader = ({ section }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{formatDateHeader(section.title)}</Text>
      <View style={styles.sectionTotals}>
        <Text style={styles.incomeText}>{formatMoney(section.income)}</Text>
        <Text style={styles.expenseText}>{formatMoney(section.expense)}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transactions</Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Pressable onPress={() => router.push("/calendar")}>
            <Ionicons name="calendar-outline" size={22} color="#fff" />
          </Pressable>

          <Pressable onPress={() => router.push("/monthly")}>
            <Ionicons name="calendar" size={22} color="#fff" />
          </Pressable>

          <Pressable onPress={() => router.push("/total")}>
            <Ionicons name="stats-chart-outline" size={22} color="#fff" />
          </Pressable>

          <Pressable onPress={() => router.push("/add-transaction")}>
            <Ionicons name="add-circle" size={28} color={Colors.primary} />
          </Pressable>
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {["All", "Income", "Expense", "Transfer"].map((f) => (
          <Pressable
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}>
            <Text
              style={[
                styles.filterText,
                filter === f && styles.filterTextActive,
              ]}>
              {f}
            </Text>
          </Pressable>
        ))}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: 100 }}
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 12,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    marginBottom: 10,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "#1E1E1E",
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    color: "#aaa",
    fontSize: 13,
  },
  filterTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  sectionTotals: {
    flexDirection: "row",
    gap: 12,
  },
  incomeText: {
    color: "#4CAF50",
    fontSize: 13,
    fontWeight: "600",
  },
  expenseText: {
    color: "#FF5A5F",
    fontSize: 13,
    fontWeight: "600",
  },
  txRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    marginHorizontal: 12,
    marginBottom: 4,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  txLeft: {
    flex: 1,
    marginRight: 12,
  },
  txCategory: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
  },
  txAccount: {
    color: "#888",
    fontSize: 12,
    marginTop: 2,
  },
  txNote: {
    color: "#666",
    fontSize: 12,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: "600",
  },
  empty: {
    color: "#666",
    textAlign: "center",
    marginTop: 60,
    fontSize: 15,
  },
});
