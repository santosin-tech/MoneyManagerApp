// app/(tabs)/accounts.js
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
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";
import { useApp } from "../../context/AppContext";
import { getDatabase } from "../../database/db";

const GROUP_ORDER = ["Cash", "Accounts", "Savings", "Investments", "Loan"];

export default function AccountsScreen() {
  const router = useRouter();
  const { formatMoney, refreshAccounts } = useApp();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAccounts = async () => {
    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync(`
        SELECT * FROM accounts
        WHERE is_hidden = 0
        ORDER BY 
          CASE group_type
            WHEN 'Cash' THEN 1
            WHEN 'Accounts' THEN 2
            WHEN 'Savings' THEN 3
            WHEN 'Investments' THEN 4
            WHEN 'Loan' THEN 5
            ELSE 6
          END,
          sort_order ASC,
          name ASC
      `);
      setAccounts(rows);
    } catch (error) {
      console.log("Error loading accounts:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAccounts();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadAccounts();
    if (refreshAccounts) refreshAccounts();
  };

  // Safe totals calculation
  const safeAccounts = accounts || [];
  const assets = safeAccounts
    .filter((a) => a.group_type !== "Loan")
    .reduce((sum, a) => sum + Number(a.balance || 0), 0);

  const liabilities = safeAccounts
    .filter((a) => a.group_type === "Loan")
    .reduce((sum, a) => sum + Number(a.balance || 0), 0);

  const netWorth = assets - liabilities;

  const isLiabilityAccount = (account) =>
    account.group_type?.toLowerCase() === "loan" ||
    account.type?.toLowerCase() === "loan";

  // Group accounts safely
  const grouped = {};
  GROUP_ORDER.forEach((g) => (grouped[g] = []));

  safeAccounts.forEach((acc) => {
    const g = isLiabilityAccount(acc) ? "Loan" : acc.group_type || "Accounts";
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push(acc);
  });

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
        <Text style={styles.headerTitle}>Accounts</Text>

        <View style={styles.headerButtons}>
          <Pressable
            onPress={() => router.push("/manage-accounts")}
            style={styles.headerIcon}>
            <Ionicons name="options-outline" size={24} color="#fff" />
          </Pressable>

          <Pressable onPress={() => router.push("/add-account")}>
            <Ionicons
              name="add-circle-outline"
              size={28}
              color={Colors.primary}
            />
          </Pressable>
        </View>
      </View>
      {/* Net Worth Card */}
      <View style={styles.netWorthCard}>
        <Text style={styles.netWorthLabel}>Net Worth</Text>
        <Text
          style={[
            styles.netWorthValue,
            { color: netWorth >= 0 ? "#4CAF50" : "#FF5A5F" },
          ]}>
          {formatMoney(netWorth)}
        </Text>

        <View style={styles.netWorthRow}>
          <View style={styles.netWorthItem}>
            <Text style={styles.netWorthItemLabel}>Assets</Text>
            <Text style={[styles.netWorthItemValue, { color: "#4CAF50" }]}>
              {formatMoney(assets)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.netWorthItem}>
            <Text style={styles.netWorthItemLabel}>Liabilities</Text>
            <Text style={[styles.netWorthItemValue, { color: "#FF5A5F" }]}>
              {formatMoney(liabilities)}
            </Text>
          </View>
        </View>
      </View>

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
        {GROUP_ORDER.map((groupName) => {
          const items = grouped[groupName];
          if (!items || items.length === 0) return null;

          return (
            <View key={groupName} style={styles.groupSection}>
              <Text style={styles.groupTitle}>{groupName}</Text>

              {items.map((acc) => (
                <Pressable
                  key={acc.id}
                  style={styles.accountRow}
                  onPress={() => router.push(`/account/${acc.id}`)}>
                  <Text style={styles.accountName}>{acc.name}</Text>
                  <Text
                    style={[
                      styles.accountBalance,
                      {
                        color: isLiabilityAccount(acc)
                          ? "#FF5A5F"
                          : Number(acc.balance || 0) >= 0
                            ? "#4CAF50"
                            : "#FF5A5F",
                      },
                    ]}>
                    {formatMoney(acc.balance)}
                  </Text>
                </Pressable>
              ))}
            </View>
          );
        })}
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 26,
    paddingBottom: 12,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  summaryRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
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
  groupSection: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  groupTitle: {
    color: "#888",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  accountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  accountName: {
    color: "#fff",
    fontSize: 16,
  },
  accountBalance: {
    fontSize: 16,
    fontWeight: "600",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerIcon: {
    padding: 4,
  },
  netWorthCard: {
    backgroundColor: "#1E1E1E",
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  netWorthLabel: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 6,
  },
  netWorthValue: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 16,
  },
  netWorthRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
    alignItems: "center",
  },
  netWorthItem: {
    alignItems: "center",
    flex: 1,
  },
  netWorthItemLabel: {
    color: "#888",
    fontSize: 13,
    marginBottom: 4,
  },
  netWorthItemValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: "#333",
  },
});
