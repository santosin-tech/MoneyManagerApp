// app/calendar.js
import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/Colors";
import { useApp } from "../context/AppContext";
import { getDatabase } from "../database/db";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getMonthMatrix(year, month) {
  // Returns a 6-week matrix of Date objects (or null for empty cells)
  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const matrix = [];
  let week = new Array(7).fill(null);
  let dayCounter = 1;

  // Fill first week
  for (let i = startDay; i < 7; i++) {
    week[i] = new Date(year, month, dayCounter++);
  }
  matrix.push(week);

  // Remaining weeks
  while (dayCounter <= daysInMonth) {
    week = new Array(7).fill(null);
    for (let i = 0; i < 7 && dayCounter <= daysInMonth; i++) {
      week[i] = new Date(year, month, dayCounter++);
    }
    matrix.push(week);
  }

  return matrix;
}

function toDateKey(date) {
  if (!date) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function CalendarScreen() {
  const router = useRouter();
  const { formatMoney } = useApp();

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-11
  const [selectedDate, setSelectedDate] = useState(toDateKey(today));
  const [dayData, setDayData] = useState({}); // { '2026-10-17': { income, expense, count } }
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const matrix = useMemo(
    () => getMonthMatrix(currentYear, currentMonth),
    [currentYear, currentMonth],
  );

  const monthTitle = new Date(currentYear, currentMonth).toLocaleDateString(
    "en-GB",
    { month: "long", year: "numeric" },
  );

  const loadMonthData = async () => {
    try {
      const db = await getDatabase();
      const start = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`;
      const endDate = new Date(currentYear, currentMonth + 1, 0);
      const end = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;

      const rows = await db.getAllAsync(
        `
        SELECT date, type, amount
        FROM transactions
        WHERE date >= ? AND date <= ?
        `,
        [start, end],
      );

      const summary = {};
      (rows || []).forEach((tx) => {
        const key = (tx.date || "").split("T")[0];
        if (!key) return;
        if (!summary[key]) {
          summary[key] = { income: 0, expense: 0, count: 0 };
        }
        const amount = Number(tx.amount) || 0;
        if (tx.type === "income") summary[key].income += amount;
        else if (tx.type === "expense") summary[key].expense += amount;
        summary[key].count += 1;
      });

      setDayData(summary);
    } catch (error) {
      console.log("Calendar load error:", error.message);
      setDayData({});
    } finally {
      setLoading(false);
    }
  };

  const loadDayTransactions = async (dateKey) => {
    if (!dateKey) {
      setTransactions([]);
      return;
    }
    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync(
        `
        SELECT t.*, a.name as account_name, c.name as category_name
        FROM transactions t
        LEFT JOIN accounts a ON a.id = t.account_id
        LEFT JOIN categories c ON c.id = t.category_id
        WHERE t.date LIKE ?
        ORDER BY t.id DESC
        `,
        [`${dateKey}%`],
      );
      setTransactions(rows || []);
    } catch (error) {
      console.log("Day transactions error:", error.message);
      setTransactions([]);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMonthData();
      loadDayTransactions(selectedDate);
    }, [currentYear, currentMonth, selectedDate]),
  );

  const changeMonth = (delta) => {
    let newMonth = currentMonth + delta;
    let newYear = currentYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const onSelectDay = (date) => {
    if (!date) return;
    const key = toDateKey(date);
    setSelectedDate(key);
  };

  const renderDay = (date, index) => {
    if (!date) {
      return <View key={`empty-${index}`} style={styles.dayCell} />;
    }

    const key = toDateKey(date);
    const data = dayData[key];
    const isSelected = key === selectedDate;
    const isToday = key === toDateKey(today);

    return (
      <Pressable
        key={key}
        style={[
          styles.dayCell,
          isSelected && styles.daySelected,
          isToday && !isSelected && styles.dayToday,
        ]}
        onPress={() => onSelectDay(date)}>
        <Text
          style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}>
          {date.getDate()}
        </Text>

        {data && data.count > 0 && (
          <View style={styles.dots}>
            {data.income > 0 && (
              <View style={[styles.dot, { backgroundColor: "#4CAF50" }]} />
            )}
            {data.expense > 0 && (
              <View style={[styles.dot, { backgroundColor: "#FF5A5F" }]} />
            )}
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Calendar</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Month navigation */}
      <View style={styles.monthNav}>
        <Pressable onPress={() => changeMonth(-1)} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.monthTitle}>{monthTitle}</Text>
        <Pressable onPress={() => changeMonth(1)} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </Pressable>
      </View>

      {/* Weekday headers */}
      <View style={styles.weekRow}>
        {WEEK_DAYS.map((d) => (
          <Text key={d} style={styles.weekDay}>
            {d}
          </Text>
        ))}
      </View>

      {/* Calendar grid */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          style={{ marginTop: 40 }}
        />
      ) : (
        <View style={styles.grid}>
          {matrix.map((week, wIndex) => (
            <View key={wIndex} style={styles.weekRow}>
              {week.map((date, dIndex) =>
                renderDay(date, `${wIndex}-${dIndex}`),
              )}
            </View>
          ))}
        </View>
      )}

      {/* Selected day summary */}
      <View style={styles.daySummary}>
        <Text style={styles.daySummaryTitle}>
          {selectedDate
            ? new Date(selectedDate).toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "short",
              })
            : "Select a day"}
        </Text>
        {dayData[selectedDate] && (
          <View style={styles.dayTotals}>
            <Text style={{ color: "#4CAF50" }}>
              +{formatMoney(dayData[selectedDate].income)}
            </Text>
            <Text style={{ color: "#FF5A5F" }}>
              -{formatMoney(dayData[selectedDate].expense)}
            </Text>
          </View>
        )}
      </View>

      {/* Transactions for selected day */}
      <FlatList
        data={transactions}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <Text style={{ color: "#666", fontSize: 15 }}>No data yet</Text>
          </View>
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
                  {item.category_name || item.note || "No category"}
                </Text>
                <Text style={styles.txAccount}>{item.account_name}</Text>
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
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  navBtn: {
    padding: 8,
  },
  monthTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  weekRow: {
    flexDirection: "row",
    paddingHorizontal: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: "center",
    color: "#888",
    fontSize: 12,
    marginBottom: 6,
  },
  grid: {
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    margin: 2,
    borderRadius: 8,
  },
  daySelected: {
    backgroundColor: Colors.primary,
  },
  dayToday: {
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  dayNumber: {
    color: "#fff",
    fontSize: 14,
  },
  dayNumberSelected: {
    fontWeight: "700",
  },
  dots: {
    flexDirection: "row",
    marginTop: 2,
    gap: 3,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  daySummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  daySummaryTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  dayTotals: {
    flexDirection: "row",
    gap: 12,
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
  txAccount: {
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
    marginTop: 30,
  },
});
