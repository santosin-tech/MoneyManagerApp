// app/add-budget.js
import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/Colors";
import { useApp } from "../context/AppContext";
import { getDatabase } from "../database/db";
import { BudgetSchema, validate } from "../schemas";

export default function AddBudgetScreen() {
  const router = useRouter();
  const { editId } = useLocalSearchParams();
  const isEditMode = !!editId;

  const { expenseCategories } = useApp();

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [amount, setAmount] = useState("");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(isEditMode);

  const currentMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    if (isEditMode) {
      loadBudget();
    }
  }, [editId]);

  const loadBudget = async () => {
    try {
      const db = await getDatabase();
      const budget = await db.getFirstAsync(
        `SELECT b.*, c.name as category_name 
         FROM budgets b 
         LEFT JOIN categories c ON b.category_id = c.id 
         WHERE b.id = ?`,
        editId,
      );

      if (budget) {
        setAmount(String(budget.amount));
        const cat = expenseCategories.find((c) => c.id === budget.category_id);
        if (cat) setSelectedCategory(cat);
      }
    } catch (error) {
      console.log("Load budget error:", error);
      Alert.alert("Error", "Could not load budget");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedCategory) {
      Alert.alert("Missing Category", "Please select a category");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid budget amount");
      return;
    }

    setIsSaving(true);

    try {
      const cleanData = validate(BudgetSchema, {
        category_id: selectedCategory.id,
        amount: Number(amount),
        month: currentMonth,
      });

      const db = await getDatabase();

      if (isEditMode) {
        await db.runAsync(
          `UPDATE budgets SET category_id = ?, amount = ?, updated_at = datetime('now') WHERE id = ?`,
          cleanData.category_id,
          cleanData.amount,
          editId,
        );
      } else {
        // Check for existing budget for same category + month
        const existing = await db.getFirstAsync(
          `SELECT id FROM budgets WHERE category_id = ? AND month = ?`,
          cleanData.category_id,
          cleanData.month,
        );

        if (existing) {
          await db.runAsync(
            `UPDATE budgets SET amount = ?, updated_at = datetime('now') WHERE id = ?`,
            cleanData.amount,
            existing.id,
          );
        } else {
          await db.runAsync(
            `INSERT INTO budgets (category_id, amount, month) VALUES (?, ?, ?)`,
            cleanData.category_id,
            cleanData.amount,
            cleanData.month,
          );
        }
      }

      Alert.alert("Success", isEditMode ? "Budget updated!" : "Budget saved!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.log("Save budget error:", error);
      Alert.alert("Error", error.message || "Failed to save budget");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Budget",
      "Are you sure you want to delete this budget?",
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
      await db.runAsync(`DELETE FROM budgets WHERE id = ?`, editId);
      Alert.alert("Deleted", "Budget has been deleted", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to delete budget");
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}>
        <Text style={{ color: "#fff" }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>
          {isEditMode ? "Edit Budget" : "New Budget"}
        </Text>
        {isEditMode ? (
          <Pressable onPress={handleDelete} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={24} color="#FF5A5F" />
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Month Info */}
        <View style={styles.monthCard}>
          <Text style={styles.monthLabel}>Budget for</Text>
          <Text style={styles.monthValue}>{currentMonth}</Text>
        </View>

        {/* Category Selector */}
        <Text style={styles.label}>Category</Text>
        <Pressable
          style={styles.selector}
          onPress={() => setShowCategoryPicker(!showCategoryPicker)}>
          <Text style={styles.selectorValue}>
            {selectedCategory ? selectedCategory.name : "Select Category"}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#888" />
        </Pressable>

        {showCategoryPicker && (
          <View style={styles.pickerBox}>
            <ScrollView style={{ maxHeight: 200 }}>
              {expenseCategories.map((cat) => (
                <Pressable
                  key={cat.id}
                  style={styles.pickerItem}
                  onPress={() => {
                    setSelectedCategory(cat);
                    setShowCategoryPicker(false);
                  }}>
                  <Text style={styles.pickerItemText}>{cat.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Amount */}
        <Text style={styles.label}>Budget Amount (₦)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 50000"
          placeholderTextColor="#666"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />

        {/* Save Button */}
        <Pressable
          style={[styles.saveButton, isSaving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={isSaving}>
          <Text style={styles.saveButtonText}>
            {isSaving
              ? "Saving..."
              : isEditMode
                ? "Update Budget"
                : "Save Budget"}
          </Text>
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
  monthCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 8,
  },
  monthLabel: {
    color: "#888",
    fontSize: 13,
  },
  monthValue: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 4,
  },
  label: {
    color: "#aaa",
    fontSize: 13,
    marginBottom: 8,
    marginTop: 16,
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  selectorValue: {
    color: "#fff",
    fontSize: 15,
    flex: 1,
  },
  pickerBox: {
    backgroundColor: "#252525",
    borderRadius: 12,
    marginTop: 8,
    overflow: "hidden",
  },
  pickerItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  pickerItemText: {
    color: "#fff",
    fontSize: 15,
  },
  input: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: "#fff",
    fontSize: 16,
  },
  saveButton: {
    marginTop: 32,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});
