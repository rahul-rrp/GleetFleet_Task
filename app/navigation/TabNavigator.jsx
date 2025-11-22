
export const MAP_IMAGE_URI = "file:///mnt/data/204477eb-9a6b-41f8-b8fb-3da0dec5ac7c.png";

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Platform } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import Home from "../screens/Home";
import Placeholder from "../screens/Placeholder";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          height: 64,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 6,
          borderTopWidth: 1,
          borderColor: '#E6E9EE',
          backgroundColor: '#fff',
        },
        tabBarLabelStyle: { fontSize: 11 },
        tabBarIcon: ({ color, size }) => {
          let iconName = "dots-horizontal";
          if (route.name === "Live") iconName = "home";
          else if (route.name === "Trips") iconName = "car";
          else if (route.name === "Reports") iconName = "file-document";
          else if (route.name === "Reminders") iconName = "bell";
          else if (route.name === "More") iconName = "dots-horizontal";
          return <MaterialCommunityIcons name={iconName} size={22} color={color} />;
        },
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: '#9CA3AF',
      })}
    >
      <Tab.Screen name="Live" component={Home} />
      <Tab.Screen name="Trips" component={Placeholder} />
      <Tab.Screen name="Reports" component={Placeholder} />
      <Tab.Screen name="Reminders" component={Placeholder} />
      <Tab.Screen name="More" component={Placeholder} />
    </Tab.Navigator>
  );
}
