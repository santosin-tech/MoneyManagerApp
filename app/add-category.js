// app/add-category.js
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
import { CategorySchema, validate } from "../schemas";

export default function AddCategoryScreen() {
  const router = useRouter();
  const { editId } = useLocalSearchParams();
  const isEditMode = !!editId;

  const { incomeCategories, expenseCategories, refreshCategories } = useApp();

  const [name, setName] = useState("");
  const [type, setType] = useState("expense");
  const [parentId, setParentId] = useState(null);
  const [showParentPicker, setShowParentPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(isEditMode);

  const availableParents =
    type === "income" ? incomeCategories : expenseCategories;

  // Load existing category when editing
  useEffect(() => {
    if (isEditMode) {
      loadCategory();
    }
  }, [editId]);

  const loadCategory = async () => {
    try {
      const db = await getDatabase();
      const cat = await db.getFirstAsync(
        `SELECT * FROM categories WHERE id = ?`,
        editId,
      );

      if (cat) {
        setName(cat.name);
        setType(cat.type);
        setParentId(cat.parent_id);
      }
    } catch (error) {
      console.log("Load category error:", error);
      Alert.alert("Error", "Could not load category");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Missing Name", "Please enter a category name");
      return;
    }

    setIsSaving(true);

    try {
      const cleanData = validate(CategorySchema, {
        name: name.trim(),
        type,
        parent_id: parentId,
        icon: null,
        color: type === "income" ? "#4CAF50" : "#FF5A5F",
        sort_order: 99,
        is_active: 1,
      });

      const db = await getDatabase();

      if (isEditMode) {
        await db.runAsync(
          `UPDATE categories 
           SET name = ?, type = ?, parent_id = ?, color = ?
           WHERE id = ?`,
          cleanData.name,
          cleanData.type,
          cleanData.parent_id,
          cleanData.color,
          editId,
        );
      } else {
        await db.runAsync(
          `INSERT INTO categories (name, type, parent_id, icon, color, sort_order, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          cleanData.name,
          cleanData.type,
          cleanData.parent_id,
          cleanData.icon,
          cleanData.color,
          cleanData.sort_order,
          cleanData.is_active,
        );
      }

      await refreshCategories();

      Alert.alert(
        "Success",
        isEditMode ? "Category updated!" : "Category created!",
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (error) {
      console.log("Save category error:", error);
      Alert.alert("Error", error.message || "Failed to save category");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Category",
      "Are you sure you want to delete this category?\n\nNote: Categories that are used in transactions cannot be deleted.",
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

      // Check if category is used in any transaction
      const used = await db.getFirstAsync(
        `SELECT COUNT(*) as count FROM transactions 
         WHERE category_id = ? OR subcategory_id = ?`,
        editId,
        editId,
      );

      if (used && used.count > 0) {
        Alert.alert(
          "Cannot Delete",
          "This category is used in existing transactions. Remove or change those transactions first.",
        );
        return;
      }

      // Also check for sub-categories
      const hasChildren = await db.getFirstAsync(
        `SELECT COUNT(*) as count FROM categories WHERE parent_id = ?`,
        editId,
      );

      if (hasChildren && hasChildren.count > 0) {
        Alert.alert(
          "Cannot Delete",
          "This category has sub-categories. Delete the sub-categories first.",
        );
        return;
      }

      await db.runAsync(`DELETE FROM categories WHERE id = ?`, editId);
      await refreshCategories();

      Alert.alert("Deleted", "Category has been deleted", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.log("Delete error:", error);
      Alert.alert("Error", "Failed to delete category");
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
          {isEditMode ? "Edit Category" : "New Category"}
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
        {/* Type Switcher */}
        <Text style={styles.label}>Type</Text>
        <View style={styles.typeSwitcher}>
          <Pressable
            style={[
              styles.typeButton,
              type === "income" && { backgroundColor: "#4CAF50" },
            ]}
            onPress={() => {
              setType("income");
              setParentId(null);
            }}>
            <Text
              style={[
                styles.typeText,
                type === "income" && { color: "#fff", fontWeight: "700" },
              ]}>
              Income
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.typeButton,
              type === "expense" && { backgroundColor: "#FF5A5F" },
            ]}
            onPress={() => {
              setType("expense");
              setParentId(null);
            }}>
            <Text
              style={[
                styles.typeText,
                type === "expense" && { color: "#fff", fontWeight: "700" },
              ]}>
              Expense
            </Text>
          </Pressable>
        </View>

        {/* Name */}
        <Text style={styles.label}>Category Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Transport, Side Hustle, Food..."
          placeholderTextColor="#666"
          value={name}
          onChangeText={setName}
        />

        {/* Parent Category */}
        <Text style={styles.label}>Parent Category (optional)</Text>
        <Pressable
          style={styles.selector}
          onPress={() => setShowParentPicker(!showParentPicker)}>
          <Text style={styles.selectorValue}>
            {parentId
              ? availableParents.find((c) => c.id === parentId)?.name
              : "None (Top-level category)"}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#888" />
        </Pressable>

        {showParentPicker && (
          <View style={styles.pickerBox}>
            <Pressable
              style={styles.pickerItem}
              onPress={() => {
                setParentId(null);
                setShowParentPicker(false);
              }}>
              <Text style={styles.pickerItemText}>None (Top-level)</Text>
            </Pressable>
            {availableParents
              .filter((c) => c.id !== Number(editId)) // prevent selecting itself as parent
              .map((cat) => (
                <Pressable
                  key={cat.id}
                  style={styles.pickerItem}
                  onPress={() => {
                    setParentId(cat.id);
                    setShowParentPicker(false);
                  }}>
                  <Text style={styles.pickerItemText}>{cat.name}</Text>
                </Pressable>
              ))}
          </View>
        )}

        {/* Save Button */}
        <Pressable
          style={[
            styles.saveButton,
            { backgroundColor: type === "income" ? "#4CAF50" : "#FF5A5F" },
            isSaving && { opacity: 0.6 },
          ]}
          onPress={handleSave}
          disabled={isSaving}>
          <Text style={styles.saveButtonText}>
            {isSaving
              ? "Saving..."
              : isEditMode
                ? "Update Category"
                : "Create Category"}
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
  label: {
    color: "#aaa",
    fontSize: 13,
    marginBottom: 8,
    marginTop: 16,
  },
  typeSwitcher: {
    flexDirection: "row",
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  typeText: {
    color: "#aaa",
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
  saveButton: {
    marginTop: 32,
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
