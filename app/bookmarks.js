// app/bookmarks.js
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

export default function BookmarksScreen() {
  const router = useRouter();
  const { formatMoney } = useApp();

  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBookmarks = async () => {
    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync(`
        SELECT 
          t.*,
          a.name as account_name,
          c.name as category_name
        FROM transactions t
        LEFT JOIN accounts a ON t.account_id = a.id
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.is_bookmarked = 1
        ORDER BY t.date DESC
      `);
      setBookmarks(rows);
    } catch (error) {
      console.log("Error loading bookmarks:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadBookmarks();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadBookmarks();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Bookmarks</Text>
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
          {bookmarks.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="bookmark-outline" size={64} color="#444" />
              <Text style={styles.emptyTitle}>No bookmarks yet</Text>
              <Text style={styles.emptySubtitle}>
                Open any transaction and tap the bookmark icon to save it here.
              </Text>
            </View>
          ) : (
            bookmarks.map((item) => {
              const isIncome = item.type === "income";
              const isTransfer = item.type === "transfer";
              const amountColor = isIncome
                ? "#4CAF50"
                : isTransfer
                  ? "#2196F3"
                  : "#FF5A5F";

              return (
                <Pressable
                  key={item.id}
                  style={styles.card}
                  onPress={() => router.push(`/transaction/${item.id}`)}>
                  <View style={styles.leftSide}>
                    <Text style={styles.categoryText}>
                      {isTransfer
                        ? "Transfer"
                        : item.category_name || "Uncategorized"}
                    </Text>
                    <Text style={styles.noteText} numberOfLines={1}>
                      {item.note || item.account_name}
                    </Text>
                    <Text style={styles.dateText}>
                      {item.date?.split("T")[0]} • {item.account_name}
                    </Text>
                  </View>

                  <Text style={[styles.amountText, { color: amountColor }]}>
                    {isIncome ? "+" : isTransfer ? "" : "-"}
                    {formatMoney(item.amount)}
                  </Text>
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
  leftSide: {
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
  dateText: {
    color: "#666",
    fontSize: 12,
    marginTop: 4,
  },
  amountText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
