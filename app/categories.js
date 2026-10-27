// app/categories.js
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/Colors";
import { useApp } from "../context/AppContext";

export default function CategoriesScreen() {
  const router = useRouter();
  const { incomeCategories, expenseCategories, subCategories } = useApp();

  const renderCategoryGroup = (title, categories, color) => (
    <View style={styles.group} key={title}>
      <Text style={[styles.groupTitle, { color }]}>{title}</Text>

      {categories.map((cat) => {
        const subs = subCategories[cat.id] || [];

        return (
          <View key={cat.id} style={styles.categoryCard}>
            {/* Main Category - now tappable */}
            <Pressable
              style={styles.mainCategory}
              onPress={() => router.push(`/add-category?editId=${cat.id}`)}>
              <View style={[styles.dot, { backgroundColor: color }]} />
              <Text style={styles.categoryName}>{cat.name}</Text>
              <Ionicons name="chevron-forward" size={18} color="#666" />
            </Pressable>

            {/* Sub Categories - also tappable */}
            {subs.length > 0 && (
              <View style={styles.subsContainer}>
                {subs.map((sub) => (
                  <Pressable
                    key={sub.id}
                    style={styles.subItem}
                    onPress={() =>
                      router.push(`/add-category?editId=${sub.id}`)
                    }>
                    <Text style={styles.subName}>↳ {sub.name}</Text>
                    <Ionicons name="chevron-forward" size={16} color="#555" />
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Categories</Text>
        <Pressable
          onPress={() => router.push("/add-category")}
          style={styles.addButton}>
          <Ionicons name="add" size={26} color="#fff" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {renderCategoryGroup("Income Categories", incomeCategories, "#4CAF50")}
        {renderCategoryGroup(
          "Expense Categories",
          expenseCategories,
          "#FF5A5F",
        )}
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
  group: {
    marginBottom: 28,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  categoryCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    marginBottom: 10,
    overflow: "hidden",
  },
  mainCategory: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  categoryName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  subsContainer: {
    borderTopWidth: 1,
    borderTopColor: "#2A2A2A",
    paddingVertical: 6,
  },
  subItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 16,
    paddingLeft: 38,
  },
  subName: {
    color: "#aaa",
    fontSize: 14,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
});
