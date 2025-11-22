
import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button } from "react-native-paper";

export default function Placeholder({ route, navigation }) {
  const title = route?.name || "Coming Soon";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>This screen is not implemented yet.</Text>

      <Button
        mode="contained"
        style={styles.btn}
        onPress={() => navigation.navigate("Live")}
      >
        Go Back to Live
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 20,
    textAlign: "center",
  },
  btn: {
    backgroundColor: "#6366F1",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
});
