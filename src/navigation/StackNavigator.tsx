import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import PropertyListScreen from '../screens/properties/PropertyListScreen';
import RoomManagementScreen from '../screens/properties/RoomManagementScreen';
import PaymentKycScreen from '../screens/properties/PaymentKycScreen';

const Stack = createStackNavigator();

const StackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PropertyList" component={PropertyListScreen} />
      <Stack.Screen name="RoomManagement" component={RoomManagementScreen} />
      <Stack.Screen name="PaymentKyc" component={PaymentKycScreen} />
    </Stack.Navigator>
  );
};

export default StackNavigator;
