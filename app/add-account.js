// app/add-account.js
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

const GROUP_OPTIONS = ["Cash", "Accounts", "Savings", "Investments", "Loan"];

const COLORS = [
  "#4CAF50",
  "#00AEEF",
  "#FF9800",
  "#9C27B0",
  "#E91E63",
  "#2196F3",
  "#F44336",
  "#795548",
  "#607D8B",
  "#FF5722",
];

export default function AddAccountScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { editId } = params;
  const isEditMode = !!editId;

  const { refreshAccounts } = useApp();

  const [name, setName] = useState("");
  const [groupType, setGroupType] = useState("Accounts");
  const [color, setColor] = useState("#4CAF50");
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(isEditMode);

  useEffect(() => {
    if (params.aiAmount) {
      // Pre-fill from AI parser
      if (params.aiType) setType(params.aiType); // or whatever your type state is called
      if (params.aiAmount) setAmount(params.aiAmount); // or your amount state
      if (params.aiNote) setNote(params.aiNote);
      if (params.aiCategory) {
        // optional: try to select the category if you have category state
      }
      // You can also try to match account name later
    }
  }, []);

  useEffect(() => {
    if (isEditMode) {
      loadAccount();
    }
  }, [editId]);

  const loadAccount = async () => {
    try {
      const db = await getDatabase();
      const acc = await db.getFirstAsync(
        `SELECT * FROM accounts WHERE id = ?`,
        editId,
      );
      if (acc) {
        setName(acc.name);
        setGroupType(acc.group_type || "Accounts");
        setColor(acc.color || "#4CAF50");
      }
    } catch (error) {
      console.log("Load account error:", error);
      Alert.alert("Error", "Could not load account");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter an account name");
      return;
    }

    try {
      setIsSaving(true);
      const db = await getDatabase();

      if (isEditMode) {
        // Update existing account
        await db.runAsync(
          `UPDATE accounts SET name = ?, group_type = ?, type = ?, color = ?, updated_at = datetime('now') WHERE id = ?`,
          [name.trim(), groupType, groupType, color, editId],
        );
      } else {
        // Get next sort_order for this group
        const maxRow = await db.getFirstAsync(
          `SELECT MAX(sort_order) as maxOrder FROM accounts WHERE group_type = ? OR type = ?`,
          [groupType, groupType],
        );
        const nextOrder = (maxRow?.maxOrder ?? 0) + 1;

        // Insert new account
        await db.runAsync(
          `INSERT INTO accounts (name, balance, type, group_type, color, is_hidden, sort_order)
           VALUES (?, 0, ?, ?, ?, 0, ?)`,
          [name.trim(), groupType, groupType, color, nextOrder],
        );
      }

      if (typeof refreshAccounts === "function") {
        await refreshAccounts();
      }

      Alert.alert(
        "Success",
        isEditMode
          ? "Account updated successfully"
          : "Account created successfully",
      );
      router.back();
    } catch (error) {
      console.log("Save account error:", error.message);
      Alert.alert("Error", error.message || "Could not save account");
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = () => {
    Alert.alert(
      "Archive Account",
      "Archived accounts are hidden from the main list but their transactions remain. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Archive",
          style: "destructive",
          onPress: confirmArchive,
        },
      ],
    );
  };

  const confirmArchive = async () => {
    try {
      const db = await getDatabase();
      await db.runAsync(
        `UPDATE accounts SET is_hidden = 1, updated_at = datetime('now') WHERE id = ?`,
        editId,
      );
      await refreshAccounts();
      Alert.alert("Archived", "Account has been archived", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to archive account");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
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
          {isEditMode ? "Edit Account" : "New Account"}
        </Text>
        {isEditMode ? (
          <Pressable onPress={handleArchive} style={styles.archiveButton}>
            <Ionicons name="archive-outline" size={24} color="#FF9800" />
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Name */}
        <Text style={styles.label}>Account Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Cash at Hand, Opay, UBA..."
          placeholderTextColor="#666"
          value={name}
          onChangeText={setName}
          autoFocus={!isEditMode}
        />

        {/* Group / Group Type */}
        <Text style={[styles.label, { marginTop: 24 }]}>Group</Text>
        <View style={styles.groupGrid}>
          {GROUP_OPTIONS.map((g) => (
            <Pressable
              key={g}
              style={[
                styles.groupChip,
                groupType === g && {
                  backgroundColor: color,
                  borderColor: color,
                },
              ]}
              onPress={() => setGroupType(g)}>
              <Text
                style={[
                  styles.groupChipText,
                  groupType === g && styles.groupChipTextActive,
                ]}>
                {g}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Color */}
        <Text style={[styles.label, { marginTop: 24 }]}>Color</Text>
        <View style={styles.colorRow}>
          {COLORS.map((c) => (
            <Pressable
              key={c}
              style={[
                styles.colorCircle,
                { backgroundColor: c },
                color === c && styles.colorSelected,
              ]}
              onPress={() => setColor(c)}
            />
          ))}
        </View>

        {/* Save Button */}
        <Pressable
          style={[
            styles.saveButton,
            { backgroundColor: color },
            isSaving && { opacity: 0.6 },
          ]}
          onPress={handleSave}
          disabled={isSaving}>
          <Text style={styles.saveButtonText}>
            {isSaving
              ? "Saving..."
              : isEditMode
                ? "Update Account"
                : "Create Account"}
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
  archiveButton: {
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
  input: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: "#fff",
    fontSize: 16,
  },
  groupGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  groupChip: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: "#1E1E1E",
    borderWidth: 1,
    borderColor: "#333",
  },
  groupChipText: {
    color: "#ccc",
    fontSize: 14,
  },
  groupChipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: "#fff",
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
