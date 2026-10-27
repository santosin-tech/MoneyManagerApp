// app/account/[id].js
import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";
import { useApp } from "../../context/AppContext";
import { getDatabase } from "../../database/db";

export default function AccountDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { formatMoney, refreshAccounts } = useApp();

  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const db = await getDatabase();

      // Get account info
      const acc = await db.getFirstAsync(
        `SELECT * FROM accounts WHERE id = ?`,
        [id],
      );
      setAccount(acc);

      // Get transactions for this account
      const rows = await db.getAllAsync(
        `
        SELECT t.*, c.name as category_name
        FROM transactions t
        LEFT JOIN categories c ON c.id = t.category_id
        WHERE t.account_id = ?
        ORDER BY t.date DESC, t.id DESC
        LIMIT 100
        `,
        [id],
      );
      setTransactions(rows || []);
    } catch (error) {
      console.log("Account detail error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [id]),
  );

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account?",
      "This will permanently delete the account. Transactions linked to it will remain but the account will be gone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const db = await getDatabase();
              await db.runAsync(`DELETE FROM accounts WHERE id = ?`, [id]);
              if (typeof refreshAccounts === "function") {
                await refreshAccounts();
              }
              router.back();
            } catch (error) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!account) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Account</Text>
          <View style={{ width: 24 }} />
        </View>
        <Text style={styles.empty}>Account not found</Text>
      </SafeAreaView>
    );
  }

  const balanceColor =
    account.group_type === "Loan"
      ? "#FF5A5F"
      : Number(account.balance) >= 0
        ? "#4CAF50"
        : "#FF5A5F";

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {account.name}
        </Text>
        <Pressable onPress={handleDeleteAccount}>
          <Ionicons name="trash-outline" size={22} color="#FF5A5F" />
        </Pressable>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={[styles.balanceValue, { color: balanceColor }]}>
          {formatMoney(account.balance)}
        </Text>
        <Text style={styles.groupText}>{account.group_type || "Accounts"}</Text>
      </View>

      {/* Transactions */}
      <Text style={styles.sectionTitle}>Recent Transactions</Text>

      <FlatList
        data={transactions}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          <Text style={styles.empty}>No transactions for this account</Text>
        }
        renderItem={({ item }) => {
          const isIncome = item.type === "income";
          const color = isIncome
            ? "#4CAF50"
            : item.type === "transfer"
              ? "#64B5F6"
              : "#FF5A5F";

          return (
            <Pressable
              style={styles.txRow}
              onPress={() => router.push(`/transaction/${item.id}`)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.txCategory}>
                  {item.category_name || item.note || item.type}
                </Text>
                <Text style={styles.txDate}>
                  {(item.date || "").split("T")[0]}
                </Text>
              </View>
              <Text style={[styles.txAmount, { color }]}>
                {isIncome ? "+" : "-"}
                {formatMoney(Math.abs(item.amount))}
              </Text>
            </Pressable>
          );
        }}
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
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 10,
  },
  balanceCard: {
    backgroundColor: "#1E1E1E",
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  balanceLabel: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 6,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: "700",
  },
  groupText: {
    color: "#888",
    fontSize: 13,
    marginTop: 8,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    marginHorizontal: 12,
    marginBottom: 6,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  txCategory: {
    color: "#fff",
    fontSize: 15,
  },
  txDate: {
    color: "#888",
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
    marginTop: 40,
    fontSize: 15,
  },
});
