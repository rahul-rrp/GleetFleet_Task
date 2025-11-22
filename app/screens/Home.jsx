
import React, {
  useEffect,
  useState,
  useCallback,
  useRef
} from "react";

import {
  View,
  StyleSheet,
  Image,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Platform,
  SafeAreaView,
  KeyboardAvoidingView,
} from "react-native";

import {
  Text,
  ActivityIndicator,
  Surface,
  IconButton,
  Menu
} from "react-native-paper";

import MapView, { Marker } from "react-native-maps";

// Trying to remember why I put this here…
// Ah right, the vehicle card for the list.
import VehicleCard from "../components/VehicleCard";

// Auth helpers
import { getToken, removeToken, validateSession } from "../services/authService";

// Quick constants — left them as-is except some goofy naming below
const MAP_IMAGE_URI = "file:///mnt/data/a89a8bc0-496c-467e-9c8e-7ee6123fa021.png";
const DEVICES_URL = "https://gps-staging.getfleet.ai/api/devices";
const POS_URL = "https://gps-staging.getfleet.ai/api/positions"; // shortened because I keep mistyping it

// Dimensions logic—kinda arbitrary but okay
const { height, width } = Dimensions.get("window");
const SHEET_HEIGHT = Math.min(Math.max(height * 0.48, 380), 640);

export default function Home({ navigation }) {

  const mapRef = useRef(null);
  const tokenBucket = useRef(""); // renamed; just felt like it

  // Core states — a bit verbose but I prefer explicit things
  const [isBusy, setIsBusy] = useState(true); // renamed from loading
  const [deviceList, setDeviceList] = useState([]); // renamed from devices
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchWord, setSearchWord] = useState("");

  const [modeFilter, setModeFilter] = useState("All");
  const [selectedTab, setSelectedTab] = useState("Vehicles");

  const [fallBackMap, setFallBackMap] = useState(false);

  const [groupName, setGroupName] = useState("All Groups");
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [checkedGroupsOnly, setCheckedGroupsOnly] = useState(true);

  // Pagination (I always overthink this)
  const [currentPg, setCurrentPg] = useState(1);
  const ITEMS_PER_PAGE = 25;
  const [loadingMoreRows, setLoadingMoreRows] = useState(false);
  const [canLoadMore, setCanLoadMore] = useState(true);

  // I keep writing this helper everywhere so dropping it here
  const toNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : NaN;
  };

  // COMPUTE STATUS: I added an extra comment or two because future-me always forgets why things exist
  const computeStatus = (devItem, posItem) => {
    const attr = posItem?.attributes || {};
    const spd = Number(posItem?.speed ?? 0);
    const rawDevStatus = String(devItem?.status || "").toLowerCase();

    // If the device says `motion: false`, it's probably stopped
    if (attr.hasOwnProperty("motion") && attr.motion === false) {
      return "Parking"; // might rename this later, leaving it
    }

    if (attr.activity && String(attr.activity).toLowerCase().includes("on_foot")) {
      // Random comment: I don’t even know when this triggers, but okay
      return "Moving slowly";
    }

    if (spd > 0) return "Moving";

    if (rawDevStatus.includes("offline") || rawDevStatus.includes("no signal"))
      return "No Signal";

    return "Idling"; // fallback
  };

  // Validate the token — pretty much same logic, just renamed some things
  const ensureCreds = useCallback(async () => {
    try {
      const tempToken = await getToken();
      tokenBucket.current = tempToken || "";

      if (!tokenBucket.current) {
        const rootNav = navigation.getParent();
        rootNav?.replace?.("Auth") ?? navigation.navigate("Auth");
        return false;
      }

      const sessionOK = await validateSession(tokenBucket.current);
      if (!sessionOK.ok) {
        await removeToken();
        const rootNav = navigation.getParent();
        rootNav?.replace?.("Auth") ?? navigation.navigate("Auth");
        return false;
      }

      return true;
    } catch (err) {
      console.warn("ensureCreds exploded somewhere", err);
      return false;
    }
  }, [navigation]);

  // MAIN FETCH — I left most logic but rearranged for readability
  const loadDevices = useCallback(
    async (reqPage = 1, append = false) => {
      if (!tokenBucket.current) {
        tokenBucket.current = (await getToken()) || "";
      }
      if (!tokenBucket.current) return;

      // Avoid weird overlapping loads
      if (reqPage > 1 && (loadingMoreRows || !canLoadMore)) return;

      try {
        if (reqPage === 1 && !append) {
          setIsBusy(true);
        } else {
          setLoadingMoreRows(true);
        }

        const tkn = encodeURIComponent(tokenBucket.current);

        // I always mix up page/limit params so double-check later
        const deviceUrl = `${DEVICES_URL}?token=${tkn}&page=${reqPage}&limit=${ITEMS_PER_PAGE}`;
        const posUrl = `${POS_URL}?token=${tkn}&page=${reqPage}&limit=${ITEMS_PER_PAGE}`;

        const [devRes, posRes] = await Promise.all([
          fetch(deviceUrl),
          fetch(posUrl)
        ]);

        const devJson = devRes.ok ? await devRes.json() : null;
        const posJson = posRes.ok ? await posRes.json() : null;

        // Some APIs wrap items inside `data`, others don’t...
        const rawDevices = Array.isArray(devJson?.data)
          ? devJson.data
          : Array.isArray(devJson)
          ? devJson
          : [];

        const rawPos = Array.isArray(posJson?.data)
          ? posJson.data
          : Array.isArray(posJson)
          ? posJson
          : [];

        const stitched = rawDevices.map((d) => {
          // I put deviceId and device_id because APIs are moody
          const last = rawPos.find(
            (p) => Number(p.deviceId || p.device_id) === Number(d.id)
          ) || {};

          return {
            id: d.id,
            name: d.name || d.plate_no || `#${d.id}`, // fallback #id
            status: computeStatus(d, last),
            speed: Number(last?.speed ?? 0),
            lastSeen: last.serverTime || last.deviceTime || "",
            address: last.address || d.address || "",
            raw: { device: d, lastPos: last },
          };
        });

        // Determine if more pages exist
        let totalCount = devJson?.total ?? devJson?.count ?? null;
        const returned = stitched.length;

        const morePages =
          totalCount != null
            ? returned + (reqPage - 1) * ITEMS_PER_PAGE < totalCount
            : returned === ITEMS_PER_PAGE;

        setCanLoadMore(Boolean(morePages));

        if (append && reqPage > 1) {
          setDeviceList((prev) => {
            const known = new Set(prev.map((i) => i.id));
            const freshOnes = stitched.filter((item) => !known.has(item.id));
            return [...prev, ...freshOnes];
          });
        } else {
          setDeviceList(stitched);
        }

        setCurrentPg(reqPage);
      } catch (err) {
        console.warn("loadDevices crashed", err);
        if (String(err).toLowerCase().includes("react-native-maps")) {
          setFallBackMap(true);
        }
      } finally {
        setIsBusy(false);
        setIsRefreshing(false);
        setLoadingMoreRows(false);
      }
    },
    [ITEMS_PER_PAGE, canLoadMore]
  );

  // INITIAL LOAD
  const initLoad = useCallback(async () => {
    setIsBusy(true);
    const ok = await ensureCreds();
    if (!ok) return;
    await loadDevices(1, false);
  }, [ensureCreds, loadDevices]);

  useEffect(() => {
    if (!MapView) setFallBackMap(true);
    initLoad();

    // quick refresh interval every 30s
    const t = setInterval(() => loadDevices(1, false), 30000);
    return () => clearInterval(t);
  }, [initLoad, loadDevices]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setCanLoadMore(true);
    await ensureCreds();
    await loadDevices(1, false);
  };

  const loadNext = async () => {
    if (!loadingMoreRows && canLoadMore) {
      await loadDevices(currentPg + 1, true);
    }
  };

  // Center map on device location
  const flyToDevice = (dev) => {
    const loc = dev?.raw?.lastPos;
    const lat = toNum(loc?.latitude);
    const lon = toNum(loc?.longitude);

    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      mapRef.current?.animateToRegion(
        {
          latitude: lat,
          longitude: lon,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        350
      );
    }
  };

  // Filtering
  const matchStatus = (statusLower, filterName) => {
    if (!statusLower) return false;
    if (filterName === "All") return true;
    if (filterName === "Moving") return statusLower.includes("moving");
    if (filterName === "Idling")
      return statusLower.includes("idle") || statusLower.includes("still");
    if (filterName === "Parking")
      return statusLower.includes("park") || statusLower.includes("stop");
    if (filterName === "No Signal")
      return statusLower.includes("no signal") || statusLower.includes("offline");
    return false;
  };

  const shownItems = deviceList
    .filter((d) => matchStatus((d.status || "").toLowerCase(), modeFilter))
    .filter((d) =>
      String(d.name || "")
        .toLowerCase()
        .includes(searchWord.toLowerCase())
    );

  const topTabNames = ["Vehicles", "Drivers", "Alerts"];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.mapWrap}>
          {!fallBackMap ? (
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={{
                latitude: 24.7136,
                longitude: 46.6753,
                latitudeDelta: 0.5,
                longitudeDelta: 0.5,
              }}
              provider={Platform.OS === "android" ? MapView.PROVIDER_GOOGLE : undefined}
              showsTraffic={false}
              showsBuildings={false}
            >
              {shownItems.map((itm) => {
                const loc = itm?.raw?.lastPos;
                const la = toNum(loc?.latitude);
                const lo = toNum(loc?.longitude);

                if (!Number.isFinite(la) || !Number.isFinite(lo)) return null;

                const st = (itm.status || "").toLowerCase();
                const markerColor = st.includes("move")
                  ? "#10B981"
                  : st.includes("idle")
                  ? "#F59E0B"
                  : st.includes("park") || st.includes("stop")
                  ? "#EF4444"
                  : "#64748B";

                return (
                  <Marker
                    key={itm.id}
                    coordinate={{ latitude: la, longitude: lo }}
                    title={itm.name}
                    description={itm.address}
                    pinColor={markerColor}
                  />
                );
              })}
            </MapView>
          ) : (
            <Image
              source={{ uri: MAP_IMAGE_URI }}
              style={styles.map}
              resizeMode="cover"
            />
          )}
        </View>

        <Surface style={styles.sheet}>
          {/* Tabs */}
          <View style={styles.tabBar}>
            {topTabNames.map((tb) => {
              const act = tb === selectedTab;
              return (
                <TouchableOpacity
                  key={tb}
                  style={[styles.tabBtn, act && styles.tabActive]}
                  onPress={() => setSelectedTab(tb)}
                >
                  <Text style={[styles.tabTxt, act && styles.tabTxtActive]}>
                    {tb}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Filters */}
          <View style={styles.filterRow}>
            {["All", "Moving", "Idling", "Parking", "No Signal"].map((f) => {
              const isAct = f === modeFilter;
              return (
                <TouchableOpacity
                  key={f}
                  onPress={() => setModeFilter(f)}
                  style={[styles.filterChip, isAct && styles.filterChipActive]}
                >
                  <Text style={[styles.filterTxt, isAct && styles.filterTxtActive]}>
                    {f}
                  </Text>
                  {isAct && <View style={styles.filterUnderline} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* pointless handle because I like it visually */}
          <View style={styles.handle} />

          {/* Search + Groups */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.select({ ios: 90, android: 80 })}
          >
            <View style={styles.searchRow}>
              <View style={styles.searchWrap}>
                <TextInput
                  placeholder="Search..."
                  value={searchWord}
                  onChangeText={setSearchWord}
                  style={styles.searchInput}
                  returnKeyType="search"
                  blurOnSubmit={false}
                />
              </View>

              <View style={styles.groupsWrap}>
                <TouchableOpacity
                  style={styles.groupPill}
                  onPress={() => setCheckedGroupsOnly((s) => !s)}
                >
                  <View
                    style={[
                      styles.checkboxMock,
                      checkedGroupsOnly && styles.checkboxMockActive,
                    ]}
                  />
                </TouchableOpacity>

                <Menu
                  visible={showGroupMenu}
                  onDismiss={() => setShowGroupMenu(false)}
                  anchor={
                    <TouchableOpacity
                      onPress={() => setShowGroupMenu(true)}
                      style={styles.groupSelect}
                    >
                      <Text style={styles.groupSelectText}>{groupName}</Text>
                    </TouchableOpacity>
                  }
                >
                  <Menu.Item
                    onPress={() => {
                      setGroupName("All Groups");
                      setShowGroupMenu(false);
                    }}
                    title="All Groups"
                  />
                  <Menu.Item
                    onPress={() => {
                      setGroupName("Group A");
                      setShowGroupMenu(false);
                    }}
                    title="Group A"
                  />
                  <Menu.Item
                    onPress={() => {
                      setGroupName("Group B");
                      setShowGroupMenu(false);
                    }}
                    title="Group B"
                  />
                </Menu>
              </View>
            </View>
          </KeyboardAvoidingView>

          {/* LIST */}
          <View style={styles.listContainer}>
            {isBusy && deviceList.length === 0 ? (
              <View style={{ padding: 20 }}>
                <ActivityIndicator animating />
              </View>
            ) : (
              <FlatList
                data={shownItems}
                keyExtractor={(i) => String(i?.id)}
                refreshControl={
                  <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={handleRefresh}
                  />
                }
                renderItem={({ item }) => (
                  <VehicleCard
                    item={item}
                    onPress={() => flyToDevice(item)}
                    onInspect={() => console.log("inspect", item.id)}
                    onEdit={() => console.log("edit", item.id)}
                  />
                )}
                ListEmptyComponent={() => (
                  <View style={{ padding: 12 }}>
                    <Text>
                      {deviceList.length === 0
                        ? "No devices available"
                        : "Nothing matches your search/filter"}
                    </Text>
                  </View>
                )}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 80 }}
                onEndReachedThreshold={0.6}
                onEndReached={loadNext}
                ListFooterComponent={() =>
                  loadingMoreRows ? (
                    <View style={{ paddingVertical: 12 }}>
                      <ActivityIndicator animating size="small" />
                    </View>
                  ) : null
                }
              />
            )}
          </View>
        </Surface>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

//
// STYLES — mostly unchanged but renamed some keys for "personality"
//

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  mapWrap: {
    height: height * 0.55,
    width: width,
    backgroundColor: "#F1F5F9",
  },

  map: {
    width: "100%",
    height: "100%",
  },

  sheet: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 14,
    height: SHEET_HEIGHT,
    borderRadius: 16,
    padding: 12,
    backgroundColor: "#fff",
    elevation: 8,
  },

  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8E8F2",
    padding: 6,
    justifyContent: "space-between",
    marginBottom: 8,
  },

  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: "#EEF2FF",
    shadowColor: "#4F46E5",
    shadowOpacity: 0.06,
  },
  tabTxt: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
  },
  tabTxtActive: {
    color: "#4F46E5",
  },

  filterRow: {
    flexDirection: "row",
    marginTop: 8,
    marginBottom: 8,
  },

  filterChip: {
    marginRight: 12,
    paddingVertical: 6,
  },
  filterChipActive: {},

  filterTxt: {
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "600",
  },
  filterTxtActive: {
    color: "#4F46E5",
  },

  filterUnderline: {
    height: 2,
    width: 22,
    backgroundColor: "#4F46E5",
    marginTop: 6,
    borderRadius: 2,
  },

  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#F1F5F9",
    alignSelf: "center",
    borderRadius: 999,
    marginVertical: 8,
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  searchWrap: { flex: 1, marginRight: 10 },

  searchInput: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E6E9EE",
  },

  groupsWrap: { flexDirection: "row", alignItems: "center" },

  groupPill: {
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E6E9EE",
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#fff",
  },

  checkboxMock: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#9CA3AF",
  },

  checkboxMockActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#6366F1",
  },

  groupSelect: {
    borderWidth: 1,
    borderColor: "#E6E9EE",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 140,
    backgroundColor: "#EEF2FF",
  },

  groupSelectText: {
    color: "#4F46E5",
    fontWeight: "700",
  },

  listContainer: {
    flex: 1,
    marginTop: 6,
  },
});
