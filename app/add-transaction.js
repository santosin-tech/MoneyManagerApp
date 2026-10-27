// app/add-transaction.js
import { useState, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getNoteSuggestions } from "../utils/noteSuggestions";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/Colors";
import { useApp } from "../context/AppContext";
import { createTransaction } from "../database/helpers";

import { Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

import { getDatabase } from "../database/db";

const TYPES = [
  { key: "income", label: "Income", color: "#4CAF50" },
  { key: "expense", label: "Expense", color: "#FF5A5F" },
  { key: "transfer", label: "Transfer", color: "#2196F3" },
];

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "back"],
];

export default function AddTransactionScreen() {
  // const { categories, formatMoney } = useApp();
  const router = useRouter();
  const [showKeypad, setShowKeypad] = useState(false);
  const params = useLocalSearchParams();
  const {
    accounts,
    incomeCategories,
    expenseCategories,
    subCategories,
    refreshAccounts,
  } = useApp();

  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("0");
  const [fromAccount, setFromAccount] = useState(accounts[0] || null);
  const [toAccount, setToAccount] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSaving, setIsSaving] = useState(false);

  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Note and Suggestions
  const [note, setNote] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Date Picker @Santosin
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { editId } = useLocalSearchParams();
  const isEditMode = !!editId;

  // AI perser useEffect
  // AI parser useEffect
  useEffect(() => {
    if (!params.aiAmount) return;

    // 1. Amount
    if (params.aiAmount) {
      setAmount(String(params.aiAmount));
    }

    // 2. Type
    if (params.aiType) {
      setType(params.aiType);
    }

    // 3. Note
    if (params.aiNote) {
      setNote(params.aiNote);
    }

    // 4. Match Account → use setFromAccount
    if (params.aiAccount && Array.isArray(accounts)) {
      const found = accounts.find(
        (acc) =>
          acc.name.toLowerCase() === String(params.aiAccount).toLowerCase(),
      );
      if (found) {
        setFromAccount(found);
      }
    }

    // 5. Match Category → combine income + expense categories
    if (params.aiCategory) {
      const allCategories = [
        ...(incomeCategories || []),
        ...(expenseCategories || []),
      ];

      const found = allCategories.find(
        (cat) =>
          cat.name.toLowerCase() === String(params.aiCategory).toLowerCase(),
      );
      if (found) {
        setSelectedCategory(found);
      }
    }
  }, [
    params.aiAmount,
    params.aiType,
    params.aiNote,
    params.aiAccount,
    params.aiCategory,
    accounts,
    incomeCategories,
    expenseCategories,
  ]);

  useEffect(() => {
    if (isEditMode) {
      loadTransactionForEdit();
    }
  }, [editId]);

  const currentType = TYPES.find((t) => t.key === type);
  const availableCategories =
    type === "income" ? incomeCategories : expenseCategories;

  const handleKeyPress = (key) => {
    if (key === "back") {
      setAmount((prev) => (prev.length === 1 ? "0" : prev.slice(0, -1)));
      return;
    }
    if (key === ".") {
      if (!amount.includes(".")) setAmount((prev) => prev + ".");
      return;
    }
    if (amount === "0") {
      setAmount(key);
    } else if (amount.length < 12) {
      setAmount((prev) => prev + key);
    }
  };

  const closeAllPickers = () => {
    setShowFromPicker(false);
    setShowToPicker(false);
    setShowCategoryPicker(false);
  };

  const handleNextOrDone = () => {
    setShowKeypad(false);
    // any other logic you already have
  };

  useEffect(() => {
    if (isEditMode) {
      loadTransactionForEdit();
    }
  }, [editId]);

  // For Note Suggestions
  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      const results = await getNoteSuggestions(note);
      if (isMounted) {
        setSuggestions(results);
      }
    };

    // Small delay so we don’t search on every single keystroke
    const timer = setTimeout(load, 250);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [note]);

  // By Santosin
  const loadTransactionForEdit = async () => {
    try {
      const db = await getDatabase();
      const tx = await db.getFirstAsync(
        `SELECT * FROM transactions WHERE id = ?`,
        editId,
      );

      if (tx) {
        setType(tx.type);
        setAmount(String(tx.amount));
        setNote(tx.note || "");
        setDate(
          tx.date?.split("T")[0] || new Date().toISOString().split("T")[0],
        );

        // Set accounts
        const fromAcc = accounts.find((a) => a.id === tx.account_id);
        if (fromAcc) setFromAccount(fromAcc);

        if (tx.to_account_id) {
          const toAcc = accounts.find((a) => a.id === tx.to_account_id);
          if (toAcc) setToAccount(toAcc);
        }

        // Set category
        if (tx.category_id) {
          const allCats = [...incomeCategories, ...expenseCategories];
          const cat = allCats.find((c) => c.id === tx.category_id);
          if (cat) setSelectedCategory(cat);
        }
      }
    } catch (error) {
      console.log("Error loading transaction for edit:", error);
      Alert.alert("Error", "Could not load transaction for editing");
    }
  };
  const handleSave = async () => {
    if (isSaving) return;

    // Validation
    if (!fromAccount) {
      Alert.alert("Missing Account", "Please select an account");
      return;
    }
    if (Number(amount) <= 0) {
      Alert.alert("Invalid Amount", "Amount must be greater than 0");
      return;
    }
    if (type === "transfer" && !toAccount) {
      Alert.alert("Missing Account", "Please select the destination account");
      return;
    }
    if (type !== "transfer" && !selectedCategory) {
      Alert.alert("Missing Category", "Please select a category");
      return;
    }

    setIsSaving(true);

    try {
      const db = await getDatabase();

      if (isEditMode) {
        // ===== EDIT MODE =====
        // 1. Get the old transaction to reverse balances
        const oldTx = await db.getFirstAsync(
          `SELECT * FROM transactions WHERE id = ?`,
          editId,
        );

        if (oldTx) {
          // Reverse old balances
          if (oldTx.type === "income") {
            await db.runAsync(
              `UPDATE accounts SET balance = balance - ? WHERE id = ?`,
              oldTx.amount,
              oldTx.account_id,
            );
          } else if (oldTx.type === "expense") {
            await db.runAsync(
              `UPDATE accounts SET balance = balance + ? WHERE id = ?`,
              oldTx.amount,
              oldTx.account_id,
            );
          } else if (oldTx.type === "transfer") {
            await db.runAsync(
              `UPDATE accounts SET balance = balance + ? WHERE id = ?`,
              oldTx.amount,
              oldTx.account_id,
            );
            if (oldTx.to_account_id) {
              await db.runAsync(
                `UPDATE accounts SET balance = balance - ? WHERE id = ?`,
                oldTx.amount,
                oldTx.to_account_id,
              );
            }
          }

          // 2. Update the transaction
          await db.runAsync(
            `UPDATE transactions SET
            type = ?, amount = ?, account_id = ?, to_account_id = ?,
            category_id = ?, note = ?, description = ?, date = ?,
            updated_at = datetime('now')
           WHERE id = ?`,
            type,
            Number(amount),
            fromAccount.id,
            type === "transfer" ? toAccount.id : null,
            type !== "transfer" ? selectedCategory.id : null,
            note.trim(),
            note.trim(),
            date + "T12:00:00",
            editId,
          );

          // 3. Apply new balances
          if (type === "income") {
            await db.runAsync(
              `UPDATE accounts SET balance = balance + ? WHERE id = ?`,
              Number(amount),
              fromAccount.id,
            );
          } else if (type === "expense") {
            await db.runAsync(
              `UPDATE accounts SET balance = balance - ? WHERE id = ?`,
              Number(amount),
              fromAccount.id,
            );
          } else if (type === "transfer") {
            await db.runAsync(
              `UPDATE accounts SET balance = balance - ? WHERE id = ?`,
              Number(amount),
              fromAccount.id,
            );
            await db.runAsync(
              `UPDATE accounts SET balance = balance + ? WHERE id = ?`,
              Number(amount),
              toAccount.id,
            );
          }
        }

        await refreshAccounts();

        Alert.alert("Success", "Transaction updated successfully!", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        // ===== CREATE MODE (existing code) =====
        await createTransaction({
          type,
          amount: Number(amount),
          account_id: fromAccount.id,
          to_account_id: type === "transfer" ? toAccount.id : null,
          category_id: type !== "transfer" ? selectedCategory.id : null,
          subcategory_id: null,
          note: note.trim(),
          description: note.trim(),
          date: date + "T12:00:00",
        });

        await refreshAccounts();

        Alert.alert("Success", "Transaction saved successfully!", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      console.log("Save error:", error);
      Alert.alert("Error", error.message || "Failed to save transaction");
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>
        {/* AI BUTTON */}
        <Pressable onPress={() => router.push("/ai-entry")}>
          <Text style={{ color: Colors.primary }}>✨ Smart Entry</Text>
        </Pressable>
        {/* END */}
        <Text style={styles.headerTitle}>
          {isEditMode ? "Edit Transaction" : "Add Transaction"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Type Switcher */}
      <View style={styles.typeSwitcher}>
        {TYPES.map((item) => {
          const isActive = type === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => {
                setType(item.key);
                setSelectedCategory(null);
                closeAllPickers();
              }}
              style={[
                styles.typeButton,
                isActive && { backgroundColor: item.color },
              ]}>
              <Text
                style={[
                  styles.typeText,
                  isActive && { color: "#fff", fontWeight: "700" },
                ]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Amount Display */}
      <Pressable
        onPress={() => setShowKeypad((visible) => !visible)}
        style={styles.amountBox}>
        <Text style={styles.amountText}>{amount ? amount : "0"}</Text>
      </Pressable>

      {!showKeypad && (
        <>
          {/* Selectors */}
          <View style={styles.selectors}>
            <Pressable
              style={styles.selector}
              onPress={() => {
                closeAllPickers();
                setShowFromPicker(true);
              }}>
              <Text style={styles.selectorLabel}>
                {type === "transfer" ? "From" : "Account"}
              </Text>
              <Text style={styles.selectorValue}>
                {fromAccount ? fromAccount.name : "Select Account"}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#888" />
            </Pressable>

            {type === "transfer" && (
              <Pressable
                style={styles.selector}
                onPress={() => {
                  closeAllPickers();
                  setShowToPicker(true);
                }}>
                <Text style={styles.selectorLabel}>To</Text>
                <Text style={styles.selectorValue}>
                  {toAccount ? toAccount.name : "Select Account"}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#888" />
              </Pressable>
            )}

            {type !== "transfer" && (
              <Pressable
                style={styles.selector}
                onPress={() => {
                  closeAllPickers();
                  setShowCategoryPicker(true);
                }}>
                <Text style={styles.selectorLabel}>Category</Text>
                <Text style={styles.selectorValue}>
                  {selectedCategory ? selectedCategory.name : "Select Category"}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#888" />
              </Pressable>
            )}

            <Pressable
              style={styles.selector}
              onPress={() => {
                closeAllPickers();
                Keyboard.dismiss();
                // Small delay helps prevent the picker from immediately reappearing on some Android devices
                setTimeout(() => {
                  setShowDatePicker(true);
                }, 100);
              }}>
              <Text style={styles.selectorLabel}>Date</Text>
              <Text style={styles.selectorValue}>{date}</Text>
              <Ionicons name="calendar-outline" size={18} color="#888" />
            </Pressable>
            {/* Native Date Picker - Stable version */}
            {showDatePicker && (
              <DateTimePicker
                value={new Date(date + "T12:00:00")}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onValueChange={(_, selectedDate) => {
                  if (selectedDate) {
                    const formatted = selectedDate.toISOString().split("T")[0];
                    setDate(formatted);
                  }
                  // Always close after selecting a date on Android
                  if (Platform.OS === "android") {
                    setShowDatePicker(false);
                  }
                }}
                onDismiss={() => {
                  setShowDatePicker(false);
                }}
                maximumDate={new Date()}
              />
            )}
          </View>

          {/* Pickers */}
          {showFromPicker && (
            <View style={styles.pickerBox}>
              <ScrollView style={{ maxHeight: 160 }}>
                {accounts.map((acc) => (
                  <Pressable
                    key={acc.id}
                    style={styles.pickerItem}
                    onPress={() => {
                      setFromAccount(acc);
                      setShowFromPicker(false);
                    }}>
                    <Text style={styles.pickerItemText}>{acc.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {showToPicker && (
            <View style={styles.pickerBox}>
              <ScrollView style={{ maxHeight: 160 }}>
                {accounts
                  .filter((acc) => acc.id !== fromAccount?.id)
                  .map((acc) => (
                    <Pressable
                      key={acc.id}
                      style={styles.pickerItem}
                      onPress={() => {
                        setToAccount(acc);
                        setShowToPicker(false);
                      }}>
                      <Text style={styles.pickerItemText}>{acc.name}</Text>
                    </Pressable>
                  ))}
              </ScrollView>
            </View>
          )}

          {showCategoryPicker && (
            <View style={styles.pickerBox}>
              <ScrollView style={{ maxHeight: 220 }}>
                {availableCategories.map((cat) => {
                  const subs = subCategories[cat.id] || [];

                  return (
                    <View key={cat.id}>
                      {/* Main Category */}
                      <Pressable
                        style={styles.pickerItem}
                        onPress={() => {
                          setSelectedCategory(cat);
                          setShowCategoryPicker(false);
                        }}>
                        <Text style={styles.pickerItemText}>{cat.name}</Text>
                      </Pressable>

                      {/* Sub Categories */}
                      {subs.map((sub) => (
                        <Pressable
                          key={sub.id}
                          style={[styles.pickerItem, styles.subCategoryItem]}
                          onPress={() => {
                            setSelectedCategory(sub);
                            setShowCategoryPicker(false);
                          }}>
                          <Text style={styles.subCategoryText}>
                            {" "}
                            ↳ {sub.name}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Note */}
          <View style={styles.noteContainer}>
            <TextInput
              style={styles.noteInput}
              placeholder="Add note (optional)"
              placeholderTextColor="#666"
              value={note}
              onChangeText={setNote}
            />
          </View>
        </>
      )}

      {/* Keypad */}
      {showKeypad && (
        <View style={styles.keypadContainer}>
          {KEYS.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.keypadRow}>
              {row.map((key) => (
                <Pressable
                  key={key}
                  style={({ pressed }) => [
                    styles.key,
                    pressed && styles.keyPressed,
                  ]}
                  onPress={() => handleKeyPress(key)}>
                  {key === "back" ? (
                    <Ionicons name="backspace-outline" size={28} color="#fff" />
                  ) : (
                    <Text style={styles.keyText}>{key}</Text>
                  )}
                </Pressable>
              ))}
            </View>
          ))}
        </View>
      )}

      {/* Done Button */}
      <View style={styles.bottomBar}>
        <Pressable
          style={[
            styles.doneButton,
            { backgroundColor: currentType.color },
            isSaving && { opacity: 0.6 },
          ]}
          onPress={handleSave}
          disabled={isSaving}>
          <Text style={styles.doneText}>{isSaving ? "Saving..." : "Done"}</Text>
        </Pressable>
      </View>
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
    paddingVertical: 10,
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
  typeSwitcher: {
    flexDirection: "row",
    marginHorizontal: 16,
    backgroundColor: "#1E1E1E",
    borderRadius: 14,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 11,
    alignItems: "center",
  },
  typeText: {
    color: "#aaa",
    fontSize: 15,
  },
  amountContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    marginTop: 24,
    marginBottom: 12,
  },
  amountBox: {
    minHeight: 96,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 14,
    backgroundColor: "#1E1E1E",
  },
  currencySymbol: {
    color: "#777",
    fontSize: 26,
    marginRight: 6,
    marginBottom: 8,
  },
  amountText: {
    color: "#fff",
    fontSize: 46,
    fontWeight: "700",
  },
  selectors: {
    paddingHorizontal: 16,
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 8,
  },
  selectorLabel: {
    color: "#888",
    fontSize: 13,
    width: 70,
  },
  selectorValue: {
    color: "#fff",
    fontSize: 15,
    flex: 1,
  },
  pickerBox: {
    marginHorizontal: 16,
    backgroundColor: "#252525",
    borderRadius: 12,
    marginBottom: 8,
    overflow: "hidden",
  },
  pickerItem: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  pickerItemText: {
    color: "#fff",
    fontSize: 15,
  },
  noteContainer: {
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  noteInput: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 15,
  },
  keypadContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  keypadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  key: {
    width: "30.5%",
    height: 62,
    backgroundColor: "#1E1E1E",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  keyPressed: {
    backgroundColor: "#333",
    transform: [{ scale: 0.96 }],
  },
  keyText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "500",
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  doneButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  doneText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  subCategoryItem: {
    paddingLeft: 24,
    backgroundColor: "#1A1A1A",
  },
  subCategoryText: {
    color: "#bbb",
    fontSize: 14,
  },
  suggestionsBox: {
    backgroundColor: "#1E1E1E",
    borderRadius: 10,
    marginTop: 6,
    overflow: "hidden",
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  suggestionText: {
    color: "#fff",
    fontSize: 15,
  },
});
