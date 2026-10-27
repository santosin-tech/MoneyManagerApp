// app/total.js
import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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

export default function TotalScreen() {
  const router = useRouter();
  const { formatMoney } = useApp();

  const [summary, setSummary] = useState({
    income: 0,
    expense: 0,
    transfer: 0,
    net: 0,
    count: 0,
    accountsTotal: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTotalData = async () => {
    try {
      const db = await getDatabase();

      // Totals from transactions
      const txRows = await db.getAllAsync(`
        SELECT type, SUM(amount) as total, COUNT(*) as count
        FROM transactions
        GROUP BY type
      `);

      let income = 0;
      let expense = 0;
      let transfer = 0;
      let count = 0;

      (txRows || []).forEach((row) => {
        const amount = Number(row.total) || 0;
        const c = Number(row.count) || 0;
        count += c;

        if (row.type === "income") income = amount;
        else if (row.type === "expense") expense = amount;
        else if (row.type === "transfer") transfer = amount;
      });

      // Current balances of all visible accounts
      const accRows = await db.getAllAsync(`
        SELECT balance, group_type FROM accounts WHERE is_hidden = 0
      `);

      let assets = 0;
      let liabilities = 0;
      (accRows || []).forEach((a) => {
        const bal = Number(a.balance) || 0;
        if (a.group_type === "Loan") {
          liabilities += bal;
        } else {
          assets += bal;
        }
      });

      setSummary({
        income,
        expense,
        transfer,
        net: income - expense,
        count,
        accountsTotal: assets - liabilities,
        assets,
        liabilities,
      });
    } catch (error) {
      console.log("Total load error:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTotalData();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadTotalData();
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const netColor = summary.net >= 0 ? "#4CAF50" : "#FF5A5F";
  const totalColor = summary.accountsTotal >= 0 ? "#4CAF50" : "#FF5A5F";

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Total</Text>
        <View style={{ width: 40 }} />
      </View>

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
        {/* Main Net Card */}
        <View style={styles.mainCard}>
          <Text style={styles.mainLabel}>All-time Net</Text>
          <Text style={[styles.mainValue, { color: netColor }]}>
            {formatMoney(summary.net)}
          </Text>
          <Text style={styles.subLabel}>{summary.count} transactions</Text>
        </View>

        {/* Income / Expense / Transfer */}
        <View style={styles.rowCards}>
          <View style={[styles.smallCard, { borderLeftColor: "#4CAF50" }]}>
            <Text style={styles.smallLabel}>Income</Text>
            <Text style={[styles.smallValue, { color: "#4CAF50" }]}>
              {formatMoney(summary.income)}
            </Text>
          </View>

          <View style={[styles.smallCard, { borderLeftColor: "#FF5A5F" }]}>
            <Text style={styles.smallLabel}>Expense</Text>
            <Text style={[styles.smallValue, { color: "#FF5A5F" }]}>
              {formatMoney(summary.expense)}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.smallCard,
            { borderLeftColor: "#64B5F6", marginTop: 10 },
          ]}>
          <Text style={styles.smallLabel}>Transfers</Text>
          <Text style={[styles.smallValue, { color: "#64B5F6" }]}>
            {formatMoney(summary.transfer)}
          </Text>
        </View>

        {/* Current Net Worth from Accounts */}
        <Text style={styles.sectionTitle}>Current Accounts</Text>

        <View style={styles.mainCard}>
          <Text style={styles.mainLabel}>Net Worth</Text>
          <Text style={[styles.mainValue, { color: totalColor }]}>
            {formatMoney(summary.accountsTotal)}
          </Text>
        </View>

        <View style={styles.rowCards}>
          <View style={[styles.smallCard, { borderLeftColor: "#4CAF50" }]}>
            <Text style={styles.smallLabel}>Assets</Text>
            <Text style={[styles.smallValue, { color: "#4CAF50" }]}>
              {formatMoney(summary.assets)}
            </Text>
          </View>

          <View style={[styles.smallCard, { borderLeftColor: "#FF5A5F" }]}>
            <Text style={styles.smallLabel}>Liabilities</Text>
            <Text style={[styles.smallValue, { color: "#FF5A5F" }]}>
              {formatMoney(summary.liabilities)}
            </Text>
          </View>
        </View>

        {/* Quick links */}
        <Text style={styles.sectionTitle}>Quick Views</Text>

        <Pressable
          style={styles.linkRow}
          onPress={() => router.push("/calendar")}>
          <Ionicons name="calendar-outline" size={22} color="#fff" />
          <Text style={styles.linkText}>Calendar View</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </Pressable>

        <Pressable
          style={styles.linkRow}
          onPress={() => router.push("/monthly")}>
          <Ionicons name="calendar" size={22} color="#fff" />
          <Text style={styles.linkText}>Monthly Summary</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </Pressable>
      </ScrollView>
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
  mainCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  mainLabel: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 6,
  },
  mainValue: {
    fontSize: 28,
    fontWeight: "700",
  },
  subLabel: {
    color: "#666",
    fontSize: 13,
    marginTop: 6,
  },
  rowCards: {
    flexDirection: "row",
    gap: 10,
  },
  smallCard: {
    flex: 1,
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
  },
  smallLabel: {
    color: "#aaa",
    fontSize: 13,
    marginBottom: 4,
  },
  smallValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 24,
    marginBottom: 12,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  linkText: {
    color: "#fff",
    fontSize: 15,
    flex: 1,
    marginLeft: 12,
  },
});
