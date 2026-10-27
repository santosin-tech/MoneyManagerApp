// app/transaction/[id].js
import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";
import { useApp } from "../../context/AppContext";
import { getDatabase } from "../../database/db";

export default function TransactionDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { formatMoney, refreshAccounts, refreshAll } = useApp();

  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    loadTransaction();
  }, [id]);

  const loadTransaction = async () => {
    try {
      const db = await getDatabase();
      const result = await db.getFirstAsync(
        `
        SELECT 
          t.*,
          a.name as account_name,
          ta.name as to_account_name,
          c.name as category_name,
          sc.name as subcategory_name
        FROM transactions t
        LEFT JOIN accounts a ON t.account_id = a.id
        LEFT JOIN accounts ta ON t.to_account_id = ta.id
        LEFT JOIN categories c ON t.category_id = c.id
        LEFT JOIN categories sc ON t.subcategory_id = sc.id
        WHERE t.id = ?
        `,
        id,
      );
      setTransaction(result);
    } catch (error) {
      console.log("Error loading transaction:", error);
      Alert.alert("Error", "Could not load transaction");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (transaction) {
      setIsBookmarked(!!transaction.is_bookmarked);
    }
  }, [transaction]);

  const handleToggleBookmark = async () => {
    try {
      const { toggleBookmark } = await import("../../database/helpers");
      const newValue = await toggleBookmark(id, isBookmarked);
      setIsBookmarked(newValue);
    } catch (error) {
      console.log("Bookmark error:", error);
      Alert.alert("Error", "Could not update bookmark");
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Transaction",
      "Are you sure you want to delete this transaction? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: confirmDelete,
        },
      ],
    );
  };

  const confirmDelete = async () => {
    try {
      const db = await getDatabase();

      // First reverse the balance change
      if (transaction.type === "income") {
        await db.runAsync(
          `UPDATE accounts SET balance = balance - ? WHERE id = ?`,
          transaction.amount,
          transaction.account_id,
        );
      } else if (transaction.type === "expense") {
        await db.runAsync(
          `UPDATE accounts SET balance = balance + ? WHERE id = ?`,
          transaction.amount,
          transaction.account_id,
        );
      } else if (transaction.type === "transfer") {
        await db.runAsync(
          `UPDATE accounts SET balance = balance + ? WHERE id = ?`,
          transaction.amount,
          transaction.account_id,
        );
        if (transaction.to_account_id) {
          await db.runAsync(
            `UPDATE accounts SET balance = balance - ? WHERE id = ?`,
            transaction.amount,
            transaction.to_account_id,
          );
        }
      }

      // Then delete the transaction
      await db.runAsync(`DELETE FROM transactions WHERE id = ?`, id);

      await refreshAccounts();

      Alert.alert("Deleted", "Transaction has been deleted", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.log("Delete error:", error);
      Alert.alert("Error", "Failed to delete transaction");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (!transaction) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Transaction not found</Text>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const isIncome = transaction.type === "income";
  const isTransfer = transaction.type === "transfer";
  const amountColor = isIncome ? "#4CAF50" : isTransfer ? "#2196F3" : "#FF5A5F";

  const makeRecurring = async (frequency) => {
    try {
      const db = await getDatabase();

      // Insert into recurring table
      await db.runAsync(
        `INSERT INTO recurring 
        (type, amount, account_id, to_account_id, category_id, subcategory_id, note, frequency, start_date, next_date, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        transaction.type,
        transaction.amount,
        transaction.account_id,
        transaction.to_account_id,
        transaction.category_id,
        transaction.subcategory_id,
        transaction.note || "",
        frequency,
        transaction.date?.split("T")[0],
        transaction.date?.split("T")[0], // next_date starts as the same day for now
      );

      // Mark the original transaction as recurring
      await db.runAsync(
        `UPDATE transactions SET is_recurring = 1 WHERE id = ?`,
        id,
      );

      Alert.alert(
        "Success",
        `This transaction is now set to repeat ${frequency}.`,
      );
    } catch (error) {
      console.log("Make recurring error:", error);
      Alert.alert("Error", "Failed to make transaction recurring");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </Pressable>

        <Text style={styles.headerTitle}>Transaction Details</Text>

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable onPress={handleToggleBookmark} style={styles.iconButton}>
            <Ionicons
              name={isBookmarked ? "bookmark" : "bookmark-outline"}
              size={24}
              color={isBookmarked ? "#FF9800" : "#fff"}
            />
          </Pressable>

          <Pressable
            onPress={() => router.push(`/add-transaction?editId=${id}`)}
            style={styles.iconButton}>
            <Ionicons name="create-outline" size={24} color="#2196F3" />
          </Pressable>

          <Pressable onPress={handleDelete} style={styles.iconButton}>
            <Ionicons name="trash-outline" size={24} color="#FF5A5F" />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Amount */}
        <View style={styles.amountSection}>
          <Text style={[styles.amountText, { color: amountColor }]}>
            {isIncome ? "+" : isTransfer ? "" : "-"}
            {formatMoney(transaction.amount)}
          </Text>
          <Text style={styles.typeText}>
            {transaction.type.charAt(0).toUpperCase() +
              transaction.type.slice(1)}
          </Text>
        </View>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          <DetailRow
            label="Account"
            value={
              isTransfer
                ? `${transaction.account_name} → ${transaction.to_account_name}`
                : transaction.account_name
            }
          />
          {!isTransfer && (
            <DetailRow
              label="Category"
              value={
                transaction.subcategory_name ||
                transaction.category_name ||
                "Uncategorized"
              }
            />
          )}
          <DetailRow label="Date" value={transaction.date?.split("T")[0]} />
          <DetailRow
            label="Note"
            value={transaction.note || "No note"}
            isLast
          />
        </View>
        {/* Make Recurring Button */}
        <Pressable
          style={styles.recurringButton}
          onPress={() => {
            Alert.alert(
              "Make Recurring",
              "How often should this transaction repeat?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Monthly",
                  onPress: () => makeRecurring("monthly"),
                },
                {
                  text: "Weekly",
                  onPress: () => makeRecurring("weekly"),
                },
                {
                  text: "Daily",
                  onPress: () => makeRecurring("daily"),
                },
              ],
            );
          }}>
          <Ionicons name="repeat-outline" size={20} color="#2196F3" />
          <Text style={styles.recurringButtonText}>Make Recurring</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value, isLast = false }) {
  return (
    <View style={[styles.detailRow, isLast && { borderBottomWidth: 0 }]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
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
  deleteButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  amountSection: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  amountText: {
    fontSize: 42,
    fontWeight: "700",
  },
  typeText: {
    color: "#888",
    fontSize: 15,
    marginTop: 6,
    textTransform: "capitalize",
  },
  detailsCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 4,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  detailLabel: {
    color: "#888",
    fontSize: 14,
  },
  detailValue: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
    maxWidth: "60%",
    textAlign: "right",
  },
  errorText: {
    color: "#fff",
    fontSize: 16,
  },
  backButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 10,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  editButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 4,
  },
  recurringButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A2A3A",
    margin: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  recurringButtonText: {
    color: "#2196F3",
    fontSize: 15,
    fontWeight: "600",
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
});
