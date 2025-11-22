
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Provider as PaperProvider } from "react-native-paper";
import { ActivityIndicator, View } from "react-native";

import Auth from "./screens/Auth";
import DashboardStack from "./navigation/DashboardStack";
import { getToken } from "./services/storageService";
import { validateSession } from "./services/authService";

const Stack = createNativeStackNavigator();

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) {
        setIsAuthenticated(false);
        setInitializing(false);
        return;
      }
      const res = await validateSession(token);
      setIsAuthenticated(Boolean(res?.ok));
      if (res?.ok && res.user) setUser(res.user);
      setInitializing(false);
    })();
  }, []);

  if (initializing) {
    return (
      <PaperProvider>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator />
        </View>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isAuthenticated ? (
            <Stack.Screen name="Dashboard">
              {(props) => <DashboardStack {...props} user={user} />}
            </Stack.Screen>
          ) : (
            <Stack.Screen name="Auth">
              {(props) => (
                <Auth
                  {...props}
                  onLogin={(userData) => {
                    setUser(userData || null);
                    setIsAuthenticated(true);
                  }}
                />
              )}
            </Stack.Screen>
          )}
        </Stack.Navigator>
    </PaperProvider>
  );
}
