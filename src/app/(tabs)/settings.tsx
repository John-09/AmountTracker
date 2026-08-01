import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Switch, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { useDataRevision } from '@/db/data-context';
import { getSettings, updateReminderSettings } from '@/db/repositories/settings';
import { useAsyncData } from '@/hooks/use-async-data';
import { exportFullBackup, pickAndRestoreBackup } from '@/services/backup';
import { exportLedgerCsv } from '@/services/csv-export';
import {
  requestNotificationPermission,
  resetReminderSchedule,
  sendTestNotification,
} from '@/services/notifications';
import { radius, spacing } from '@/theme/tokens';
import { useAppTheme } from '@/theme/use-app-theme';

function formatTime(hour: number, minute: number): string {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

function SettingsAction({
  icon,
  title,
  description,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}>
      <View style={[styles.actionIcon, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon} size={21} color={colors.primary} />
      </View>
      <View style={styles.flex}>
        <AppText variant="label">{title}</AppText>
        <AppText variant="caption" color="muted">
          {description}
        </AppText>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { revision, refreshData } = useDataRevision();
  const { colors } = useAppTheme();
  const result = useAsyncData(() => getSettings(db), null, revision);
  const [enabled, setEnabled] = useState(false);
  const [hour, setHour] = useState(21);
  const [minute, setMinute] = useState(0);
  const [message, setMessage] = useState('Add expense for today.');
  const [savingReminder, setSavingReminder] = useState(false);
  const [working, setWorking] = useState<string | null>(null);

  useEffect(() => {
    if (!result.data) return;
    const settings = result.data;
    queueMicrotask(() => {
      setEnabled(settings.reminderEnabled);
      setHour(settings.reminderHour);
      setMinute(settings.reminderMinute);
      setMessage(settings.reminderMessage);
    });
  }, [result.data]);

  if (result.loading && !result.data) {
    return (
      <Screen>
        <LoadingState label="Loading settings…" />
      </Screen>
    );
  }
  if (result.error || !result.data) {
    return (
      <Screen>
        <ErrorState message={result.error?.message ?? 'Settings are unavailable.'} onRetry={() => void result.refresh()} />
      </Screen>
    );
  }

  const openTimePicker = () => {
    const value = new Date();
    value.setHours(hour, minute, 0, 0);
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value,
        mode: 'time',
        is24Hour: false,
        onChange: (_, selected) => {
          if (selected) {
            setHour(selected.getHours());
            setMinute(selected.getMinutes());
          }
        },
      });
    }
  };

  const saveReminder = async () => {
    setSavingReminder(true);
    try {
      if (enabled && !(await requestNotificationPermission())) {
        throw new Error('Allow notifications in Android settings to enable reminders.');
      }
      await updateReminderSettings(db, {
        reminderEnabled: enabled,
        reminderHour: hour,
        reminderMinute: minute,
        reminderMessage: message,
      });
      await resetReminderSchedule(db);
      refreshData();
      Alert.alert('Reminder updated', enabled ? `We’ll remind you around ${formatTime(hour, minute)} when no expense exists.` : 'Daily reminders are off.');
    } catch (error) {
      Alert.alert('Couldn’t save reminder', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSavingReminder(false);
    }
  };

  const runTask = async (name: string, task: () => Promise<void>, success?: string) => {
    setWorking(name);
    try {
      await task();
      refreshData();
      if (success) Alert.alert('Done', success);
    } catch (error) {
      Alert.alert('Something went wrong', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setWorking(null);
    }
  };

  const confirmRestore = () => {
    Alert.alert(
      'Restore a backup?',
      'The selected backup will replace the current ledger and settings after the file is validated.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Choose backup',
          onPress: () =>
            void runTask('restore', async () => {
              const restored = await pickAndRestoreBackup(db);
              if (restored) Alert.alert('Backup restored', 'Your balance, entries, categories, and settings are restored.');
            }),
        },
      ],
    );
  };

  return (
    <Screen scroll contentStyle={styles.screen}>
      <View style={styles.header}>
        <AppText variant="title">Settings</AppText>
        <AppText color="muted">Your data stays on this device unless you export it.</AppText>
      </View>

      <Card style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <View style={[styles.actionIcon, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="notifications-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.flex}>
            <AppText variant="heading">Daily reminder</AppText>
            <AppText variant="caption" color="muted">
              Only reminds you when that date has no expense.
            </AppText>
          </View>
          <Switch
            accessibilityLabel="Enable daily expense reminder"
            value={enabled}
            onValueChange={setEnabled}
            trackColor={{ false: colors.border, true: colors.primarySoft }}
            thumbColor={enabled ? colors.primary : colors.textMuted}
          />
        </View>

        <Pressable
          disabled={!enabled}
          onPress={openTimePicker}
          style={[styles.timeField, { borderColor: colors.border }, !enabled && styles.disabled]}
        >
          <Ionicons name="time-outline" size={21} color={colors.primary} />
          <View style={styles.flex}>
            <AppText variant="caption" color="muted">
              Reminder time
            </AppText>
            <AppText variant="label">{formatTime(hour, minute)}</AppText>
          </View>
        </Pressable>
        {Platform.OS === 'ios' ? (
          <DateTimePicker
            value={new Date(2020, 0, 1, hour, minute)}
            mode="time"
            onChange={(_, selected) => {
              if (selected) {
                setHour(selected.getHours());
                setMinute(selected.getMinutes());
              }
            }}
          />
        ) : null}
        <TextField
          label="Notification message"
          value={message}
          editable={enabled}
          onChangeText={setMessage}
          maxLength={100}
          placeholder="Add expense for today."
        />
        <View style={styles.buttonRow}>
          <View style={styles.flex}>
            <Button variant="secondary" onPress={() => void runTask('test', sendTestNotification)} loading={working === 'test'}>
              Test
            </Button>
          </View>
          <View style={styles.flex}>
            <Button onPress={() => void saveReminder()} loading={savingReminder}>
              Save reminder
            </Button>
          </View>
        </View>
      </Card>

      <View style={styles.sectionHeading}>
        <AppText variant="heading">Manage</AppText>
      </View>
      <Card padded={false}>
        <SettingsAction
          icon="pricetags-outline"
          title="Expense categories"
          description="Add, rename, reorder, recolor, or archive categories."
          onPress={() => router.push('/category-management')}
        />
      </Card>

      <View style={styles.sectionHeading}>
        <AppText variant="heading">Backup and export</AppText>
        <AppText variant="caption" color="muted">
          Last backup: {result.data.lastBackupAt ? new Date(result.data.lastBackupAt).toLocaleString('en-IN') : 'Never'}
        </AppText>
      </View>
      <Card padded={false}>
        <SettingsAction
          icon="cloud-upload-outline"
          title={working === 'backup' ? 'Preparing backup…' : 'Export JSON backup'}
          description="Save a complete restorable copy using Android’s share sheet."
          onPress={() => void runTask('backup', () => exportFullBackup(db))}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <SettingsAction
          icon="cloud-download-outline"
          title={working === 'restore' ? 'Restoring…' : 'Restore JSON backup'}
          description="Validate and replace local data from an AmountTracker backup."
          onPress={confirmRestore}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <SettingsAction
          icon="document-text-outline"
          title={working === 'csv' ? 'Preparing CSV…' : 'Export all as CSV'}
          description="Open your ledger in a spreadsheet application."
          onPress={() => void runTask('csv', () => exportLedgerCsv(db))}
        />
      </Card>

      <Card style={[styles.privacyCard, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name="phone-portrait-outline" size={24} color={colors.primary} />
        <View style={styles.flex}>
          <AppText variant="label">Local and private</AppText>
          <AppText variant="caption" color="muted">
            No account, server, or cloud subscription is used. Uninstalling the app can erase its database, so keep a recent JSON backup outside the phone.
          </AppText>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { gap: spacing.lg },
  header: { gap: spacing.xs },
  flex: { flex: 1 },
  section: { gap: spacing.lg },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  sectionHeading: { gap: spacing.xs },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  actionIcon: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.62 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 70 },
  timeField: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 1, borderRadius: radius.md, padding: spacing.md },
  disabled: { opacity: 0.45 },
  buttonRow: { flexDirection: 'row', gap: spacing.md },
  privacyCard: { flexDirection: 'row', gap: spacing.md },
});
