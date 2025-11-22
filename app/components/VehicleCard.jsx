
import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, IconButton } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const statusColors = {
  moving: "#10B981",
  idle: "#F59E0B",
  stopped: "#EF4444",
  unknown: "#94A3B8",
};

export default function VehicleCard({ item, onPress, onInspect, onEdit }) {
  const rawStatus = (item?.status || "").toLowerCase();
  const statusColor = rawStatus.includes("move")
    ? statusColors.moving
    : rawStatus.includes("idle")
    ? statusColors.idle
    : rawStatus.includes("stop") || rawStatus.includes("stopped")
    ? statusColors.stopped
    : statusColors.unknown;

  return (
    <TouchableOpacity activeOpacity={0.95} onPress={() => onPress?.(item)} style={styles.wrap}>
      <View style={styles.card}>
        {/* Title row */}
        <View style={styles.titleRow}>
          <View style={styles.left}>
            <View style={styles.checkboxWrap}>
              <View style={styles.checkbox} />
            </View>

            <View style={styles.titleMeta}>
              <Text style={styles.titleText} numberOfLines={1}>
                {item?.name}
              </Text>
              <Text style={styles.dateText}>{item?.lastSeen || ""}</Text>
            </View>
          </View>

          <View style={styles.iconActions}>
            <IconButton icon="eye-outline" size={18} onPress={() => onInspect?.(item)} color="#10B981" />
            <IconButton icon="pencil-outline" size={18} onPress={() => onEdit?.(item)} color="#6D28D9" />
          </View>
        </View>

        {/* Status row */}
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Status:</Text>
          <View style={[styles.statusPill, { backgroundColor: statusColor + "22" }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{item?.status}</Text>
          </View>

          <View style={[styles.speedPill]}>
            <Text style={styles.speedText}>{item?.speed ? `${item.speed} KM/hr` : "—"}</Text>
          </View>
        </View>

        {/* Address row */}
        <View style={styles.addressRow}>
          <MaterialCommunityIcons name="map-marker" size={16} color="#F97316" />
          <Text style={styles.addressText} numberOfLines={2}>
            {item?.address || "Unknown address"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E6E9EE",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  left: { flexDirection: "row", alignItems: "center", flex: 1 },
  checkboxWrap: { width: 40, alignItems: "center", justifyContent: "center", marginRight: 6 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: "#6366F1", backgroundColor: "#EEF2FF" },
  titleMeta: { flex: 1, paddingRight: 8 },
  titleText: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  dateText: { fontSize: 12, color: "#6B7280", marginTop: 4 },

  iconActions: { flexDirection: "row", alignItems: "center" },

  statusRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  statusLabel: { fontSize: 12, color: "#6B7280", marginRight: 8, fontWeight: "600" },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginRight: 10 },
  statusText: { fontSize: 12, fontWeight: "700" },
  speedPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: "#E6E9EE" },
  speedText: { fontSize: 12, color: "#374151", fontWeight: "600" },

  addressRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  addressText: { marginLeft: 8, color: "#475569", fontSize: 12, flex: 1 },
});
