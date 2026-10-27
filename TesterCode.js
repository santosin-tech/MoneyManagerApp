{
  /* Amount Display */
}
<View style={styles.amountContainer}>
  <Text style={styles.currencySymbol}>₦</Text>
  <Text style={[styles.amountText, { color: currentType.color }]}>
    {Number(amount).toLocaleString("en-NG")}
  </Text>
</View>;

{
  /* Custom Keypad */
}
<View style={styles.keypadContainer}>
  {KEYS.map((row, rowIndex) => (
    <View key={rowIndex} style={styles.keypadRow}>
      {row.map((key) => (
        <Pressable
          key={key}
          style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
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
</View>;
