// app/manage-accounts.js
import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Switch,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/Colors";
import { getDatabase } from "../database/db";
import { useApp } from "../context/AppContext";

export default function ManageAccountsScreen() {
  const router = useRouter();
  const { refreshAccounts } = useApp();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAccounts = async () => {
    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync(`
        SELECT * FROM accounts
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
      setAccounts(Array.isArray(rows) ? rows : []);
    } catch (error) {
      console.log("Error loading accounts:", error.message);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAccounts();
    }, []),
  );

  // Toggle Show / Hide
  const toggleHidden = async (account) => {
    try {
      const db = await getDatabase();
      const newValue = account.is_hidden ? 0 : 1;

      await db.runAsync(`UPDATE accounts SET is_hidden = ? WHERE id = ?`, [
        newValue,
        account.id,
      ]);

      setAccounts((prev) =>
        prev.map((a) =>
          a.id === account.id ? { ...a, is_hidden: newValue } : a,
        ),
      );

      if (typeof refreshAccounts === "function") {
        await refreshAccounts();
      }
    } catch (error) {
      console.log("Toggle hide error:", error.message);
    }
  };

  // Move account Up or Down
  const moveAccount = async (index, direction) => {
    const newIndex = direction === "up" ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= accounts.length) return;

    const current = accounts[index];
    const target = accounts[newIndex];

    // Only allow reordering inside the same group
    if (current.group_type !== target.group_type) {
      Alert.alert(
        "Cannot move",
        "You can only reorder accounts within the same group (Cash, Accounts, Savings, etc.).",
      );
      return;
    }

    try {
      const db = await getDatabase();

      // Swap sort_order values
      const currentOrder = current.sort_order ?? index;
      const targetOrder = target.sort_order ?? newIndex;

      await db.runAsync(`UPDATE accounts SET sort_order = ? WHERE id = ?`, [
        targetOrder,
        current.id,
      ]);
      await db.runAsync(`UPDATE accounts SET sort_order = ? WHERE id = ?`, [
        currentOrder,
        target.id,
      ]);

      // Update local list immediately
      const updated = [...accounts];
      updated[index] = { ...target, sort_order: currentOrder };
      updated[newIndex] = { ...current, sort_order: targetOrder };
      setAccounts(updated);

      if (typeof refreshAccounts === "function") {
        await refreshAccounts();
      }
    } catch (error) {
      console.log("Move account error:", error.message);
    }
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
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Manage Accounts</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.hint}>
        Use the switches to show/hide accounts.{"\n"}
        Use ↑ ↓ to change the order (same group only).
      </Text>

      <FlatList
        data={accounts}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            {/* Order buttons */}
            <View style={styles.orderButtons}>
              <Pressable
                onPress={() => moveAccount(index, "up")}
                style={styles.arrowBtn}
                disabled={index === 0}>
                <Ionicons
                  name="chevron-up"
                  size={22}
                  color={index === 0 ? "#555" : "#fff"}
                />
              </Pressable>
              <Pressable
                onPress={() => moveAccount(index, "down")}
                style={styles.arrowBtn}
                disabled={index === accounts.length - 1}>
                <Ionicons
                  name="chevron-down"
                  size={22}
                  color={index === accounts.length - 1 ? "#555" : "#fff"}
                />
              </Pressable>
            </View>

            {/* Account info */}
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.group}>{item.group_type || "Accounts"}</Text>
            </View>

            {/* Show / Hide switch */}
            <Switch
              value={item.is_hidden === 0}
              onValueChange={() => toggleHidden(item)}
              trackColor={{ false: "#555", true: Colors.primary }}
              thumbColor="#fff"
            />
          </View>
        )}
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  hint: {
    color: "#888",
    fontSize: 13,
    paddingHorizontal: 16,
    marginBottom: 16,
    lineHeight: 18,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  orderButtons: {
    marginRight: 10,
  },
  arrowBtn: {
    padding: 2,
  },
  info: {
    flex: 1,
  },
  name: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  group: {
    color: "#888",
    fontSize: 12,
    marginTop: 2,
  },
  empty: {
    color: "#666",
    textAlign: "center",
    marginTop: 40,
  },
});
