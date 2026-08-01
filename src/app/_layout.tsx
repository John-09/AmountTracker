import 'react-native-gesture-handler';

import { Suspense, useEffect } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { type Href, Stack, useRouter } from 'expo-router';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { DataProvider } from '@/db/data-context';
import { migrateDatabase } from '@/db/migrations';
import { DATABASE_NAME } from '@/db/schema';
import { syncReminderSchedule } from '@/services/notifications';
import { useAppTheme } from '@/theme/use-app-theme';

function AppNavigator() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { colors, isDark } = useAppTheme();

  useEffect(() => {
    void syncReminderSchedule(db).catch((error) => {
      console.warn('Unable to refresh reminder schedule.', error);
    });

    const openNotificationRoute = (response: Notifications.NotificationResponse | null) => {
      const route = response?.notification.request.content.data?.route;
      if (typeof route === 'string') router.push(route as Href);
    };

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      openNotificationRoute(response);
      if (response) void Notifications.clearLastNotificationResponseAsync();
    });
    const notificationSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      openNotificationRoute(response);
    });
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void syncReminderSchedule(db).catch((error) => {
          console.warn('Unable to refresh reminder schedule.', error);
        });
      }
    });

    return () => {
      notificationSubscription.remove();
      appStateSubscription.remove();
    };
  }, [db, router]);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="add-expense" options={{ title: 'Add expense', presentation: 'modal' }} />
        <Stack.Screen name="add-credit" options={{ title: 'Add credit', presentation: 'modal' }} />
        <Stack.Screen name="edit-entry" options={{ title: 'Edit entry', presentation: 'modal' }} />
        <Stack.Screen name="category-management" options={{ title: 'Expense categories' }} />
      </Stack>
    </>
  );
}

function DatabaseLoading() {
  return (
    <Screen includeBottomInset contentStyle={{ alignItems: 'center', justifyContent: 'center' }}>
      <AppText variant="heading">Preparing AmountTracker…</AppText>
    </Screen>
  );
}

export default function RootLayout() {
  return (
    <Suspense fallback={<DatabaseLoading />}>
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDatabase} useSuspense>
        <DataProvider>
          <AppNavigator />
        </DataProvider>
      </SQLiteProvider>
    </Suspense>
  );
}
