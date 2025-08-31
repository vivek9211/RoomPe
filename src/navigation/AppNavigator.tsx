import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';

// Auth Screens
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import TenantRegistrationScreen from '../screens/auth/TenantRegistrationScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import EmailVerificationScreen from '../screens/auth/EmailVerificationScreen';
import PhoneVerificationScreen from '../screens/auth/PhoneVerificationScreen';
import RoleSelectionScreen from '../screens/auth/RoleSelectionScreen';
import LoadingScreen from '../screens/auth/LoadingScreen';

// Onboarding Screens - Only used when explicitly navigating to onboarding
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';

// Dashboard Screens
import OwnerDashboardScreen from '../screens/dashboard/OwnerDashboardScreen';
import TenantDashboardScreen from '../screens/dashboard/TenantDashboardScreen';
import PropertySelectionScreen from '../screens/dashboard/PropertySelectionScreen';

// Property Screens
import PropertyListScreen from '../screens/properties/PropertyListScreen';
import PropertyDetailScreen from '../screens/properties/PropertyDetailScreen';
import AddPropertyScreen from '../screens/properties/AddPropertyScreen';
import EditPropertyScreen from '../screens/properties/EditPropertyScreen';

// Room Mapping Screens
import RoomMappingScreen from '../screens/properties/RoomMappingScreen';
import FloorConfigurationScreen from '../screens/properties/FloorConfigurationScreen';
import FloorUnitConfigurationScreen from '../screens/properties/FloorUnitConfigurationScreen';
import RoomMappingCompleteScreen from '../screens/properties/RoomMappingCompleteScreen';

// Room Management Screen
import RoomManagementScreen from '../screens/properties/RoomManagementScreen';

// Tenant Screens
import TenantListScreen from '../screens/tenants/TenantListScreen';
import TenantDetailScreen from '../screens/tenants/TenantDetailScreen';
import AddTenantScreen from '../screens/tenants/AddTenantScreen';
import EditTenantScreen from '../screens/tenants/EditTenantScreen';

// Payment Screens
import PaymentListScreen from '../screens/payments/PaymentListScreen';
import PaymentDetailScreen from '../screens/payments/PaymentDetailScreen';
import AddPaymentScreen from '../screens/payments/AddPaymentScreen';

// Maintenance Screens
import MaintenanceListScreen from '../screens/maintenance/MaintenanceListScreen';
import MaintenanceDetailScreen from '../screens/maintenance/MaintenanceDetailScreen';
import AddMaintenanceScreen from '../screens/maintenance/AddMaintenanceScreen';

// Reports Screens
import ReportsScreen from '../screens/reports/ReportsScreen';
import FinancialReportScreen from '../screens/reports/FinancialReportScreen';

// Settings Screens
import SettingsScreen from '../screens/settings/SettingsScreen';
import ProfileScreen from '../screens/settings/ProfileScreen';

// Analytics Screen
import AnalyticsScreen from '../screens/dashboard/AnalyticsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Owner Tab Navigator
const OwnerTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="OwnerDashboard"
        component={OwnerDashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Properties"
        component={PropertyListScreen}
        options={{
          tabBarLabel: 'Properties',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>🏢</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Tenants"
        component={TenantListScreen}
        options={{
          tabBarLabel: 'Tenants',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>👥</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Payments"
        component={PaymentListScreen}
        options={{
          tabBarLabel: 'Payments',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>💰</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          tabBarLabel: 'Analytics',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>📊</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Tenant Tab Navigator
const TenantTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="TenantDashboard"
        component={TenantDashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Payments"
        component={PaymentListScreen}
        options={{
          tabBarLabel: 'Payments',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>💰</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Maintenance"
        component={MaintenanceListScreen}
        options={{
          tabBarLabel: 'Maintenance',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>🔧</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>⚙️</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          // Auth Stack
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="TenantRegistration" component={TenantRegistrationScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
            <Stack.Screen name="PhoneVerification" component={PhoneVerificationScreen} />
          </>
        ) : !userProfile ? (
          // Loading user profile
          <Stack.Screen name="Loading" component={LoadingScreen} />
        ) : !userProfile.role ? (
          // Role Selection - User authenticated but no role assigned
          <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
        ) : userProfile.role === 'owner' ? (
          // Owner Stack - User has owner role, show owner dashboard
          <>
            <Stack.Screen name="OwnerTabs" component={OwnerTabNavigator} />
            <Stack.Screen name="PropertySelection" component={PropertySelectionScreen} />
            <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} />
            <Stack.Screen name="AddProperty" component={AddPropertyScreen} />
            <Stack.Screen name="EditProperty" component={EditPropertyScreen} />
            
            {/* Room Mapping Screens */}
            <Stack.Screen name="RoomMapping" component={RoomMappingScreen} />
            <Stack.Screen name="FloorConfiguration" component={FloorConfigurationScreen} />
            <Stack.Screen name="FloorUnitConfiguration" component={FloorUnitConfigurationScreen} />
            <Stack.Screen name="RoomMappingComplete" component={RoomMappingCompleteScreen} />
            
            {/* Room Management Screen */}
            <Stack.Screen name="RoomManagement" component={RoomManagementScreen} />
            <Stack.Screen name="TenantDetail" component={TenantDetailScreen} />
            <Stack.Screen name="AddTenant" component={AddTenantScreen} />
            <Stack.Screen name="EditTenant" component={EditTenantScreen} />
            <Stack.Screen name="PaymentDetail" component={PaymentDetailScreen} />
            <Stack.Screen name="AddPayment" component={AddPaymentScreen} />
            <Stack.Screen name="MaintenanceDetail" component={MaintenanceDetailScreen} />
            <Stack.Screen name="AddMaintenance" component={AddMaintenanceScreen} />
            <Stack.Screen name="Reports" component={ReportsScreen} />
            <Stack.Screen name="FinancialReport" component={FinancialReportScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          </>
        ) : (
          // Tenant Stack - User has tenant role, show tenant dashboard
          <>
            <Stack.Screen name="TenantTabs" component={TenantTabNavigator} />
            <Stack.Screen name="PaymentDetail" component={PaymentDetailScreen} />
            <Stack.Screen name="MaintenanceDetail" component={MaintenanceDetailScreen} />
            <Stack.Screen name="AddMaintenance" component={AddMaintenanceScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
