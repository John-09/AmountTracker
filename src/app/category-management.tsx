import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { useDataRevision } from '@/db/data-context';
import {
  createCategory,
  deleteCategory,
  listCategories,
  reorderCategories,
  setCategoryArchived,
  updateCategory,
} from '@/db/repositories/categories';
import { useAsyncData } from '@/hooks/use-async-data';
import { categoryPalette, radius, spacing } from '@/theme/tokens';
import { useAppTheme } from '@/theme/use-app-theme';
import type { ExpenseCategory } from '@/types';

const ICONS = [
  'restaurant-outline',
  'basket-outline',
  'bus-outline',
  'bag-handle-outline',
  'home-outline',
  'receipt-outline',
  'medkit-outline',
  'game-controller-outline',
  'school-outline',
  'airplane-outline',
  'sparkles-outline',
  'ellipsis-horizontal-circle-outline',
] as const;

export default function CategoryManagementScreen() {
  const db = useSQLiteContext();
  const { revision, refreshData } = useDataRevision();
  const { colors } = useAppTheme();
  const result = useAsyncData(() => listCategories(db, true), [], revision);
  const [editing, setEditing] = useState<ExpenseCategory | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<string>(ICONS[0]);
  const [color, setColor] = useState(categoryPalette[0]);
  const [saving, setSaving] = useState(false);

  const openEditor = (category: ExpenseCategory | null) => {
    setEditing(category);
    setName(category?.name ?? '');
    setIcon(category?.icon ?? ICONS[0]);
    setColor(category?.color ?? categoryPalette[0]);
    setModalOpen(true);
  };

  if (result.loading && result.data.length === 0) {
    return (
      <Screen>
        <LoadingState label="Loading categories…" />
      </Screen>
    );
  }
  if (result.error) {
    return (
      <Screen>
        <ErrorState message={result.error.message} onRetry={() => void result.refresh()} />
      </Screen>
    );
  }

  const active = result.data.filter((category) => !category.isArchived);
  const archived = result.data.filter((category) => category.isArchived);

  const save = async () => {
    setSaving(true);
    try {
      if (editing) await updateCategory(db, editing.id, { name, icon, color });
      else await createCategory(db, { name, icon, color });
      refreshData();
      setModalOpen(false);
    } catch (error) {
      Alert.alert('Couldn’t save category', error instanceof Error ? error.message : 'Please use another name.');
    } finally {
      setSaving(false);
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= active.length) return;
    const reordered = [...active];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    await reorderCategories(db, reordered.map((category) => category.id));
    refreshData();
  };

  const confirmDelete = (category: ExpenseCategory) => {
    Alert.alert('Delete category?', 'Only unused custom categories can be deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          void deleteCategory(db, category.id)
            .then(refreshData)
            .catch((error) => Alert.alert('Can’t delete category', error.message)),
      },
    ]);
  };

  const renderCategory = (category: ExpenseCategory, index?: number) => (
    <Card key={category.id} style={styles.categoryCard}>
      <View style={[styles.categoryIcon, { backgroundColor: `${category.color}20` }]}>
        <Ionicons
          name={category.icon as React.ComponentProps<typeof Ionicons>['name']}
          size={22}
          color={category.color}
        />
      </View>
      <View style={styles.flex}>
        <AppText variant="label">{category.name}</AppText>
        <AppText variant="caption" color="muted">
          {category.isDefault ? 'Default category' : 'Custom category'}
          {category.isArchived ? ' · Archived' : ''}
        </AppText>
      </View>
      {typeof index === 'number' ? (
        <View style={styles.reorderButtons}>
          <Pressable disabled={index === 0} onPress={() => void move(index, -1)}>
            <Ionicons name="chevron-up" size={21} color={index === 0 ? colors.border : colors.textMuted} />
          </Pressable>
          <Pressable disabled={index === active.length - 1} onPress={() => void move(index, 1)}>
            <Ionicons
              name="chevron-down"
              size={21}
              color={index === active.length - 1 ? colors.border : colors.textMuted}
            />
          </Pressable>
        </View>
      ) : null}
      <Pressable
        accessibilityLabel={`Edit ${category.name}`}
        onPress={() => openEditor(category)}
      >
        <Ionicons name="create-outline" size={22} color={colors.primary} />
      </Pressable>
      <Pressable
        accessibilityLabel={category.isArchived ? `Restore ${category.name}` : `Archive ${category.name}`}
        onPress={() =>
          void setCategoryArchived(db, category.id, !category.isArchived).then(refreshData)
        }
      >
        <Ionicons name={category.isArchived ? 'refresh-outline' : 'archive-outline'} size={21} color={colors.textMuted} />
      </Pressable>
      {!category.isDefault ? (
        <Pressable accessibilityLabel={`Delete ${category.name}`} onPress={() => confirmDelete(category)}>
          <Ionicons name="trash-outline" size={21} color={colors.expense} />
        </Pressable>
      ) : null}
    </Card>
  );

  return (
    <>
      <Screen scroll contentStyle={styles.screen}>
        <View style={styles.intro}>
          <AppText color="muted">Categories keep expense reports useful. Archived categories remain on old entries.</AppText>
          <Button
            icon="add-outline"
            onPress={() => openEditor(null)}
          >
            New category
          </Button>
        </View>
        <AppText variant="heading">Active</AppText>
        {active.map((category, index) => renderCategory(category, index))}
        {archived.length ? (
          <>
            <AppText variant="heading" style={styles.archivedHeading}>
              Archived
            </AppText>
            {archived.map((category) => renderCategory(category))}
          </>
        ) : null}
      </Screen>

      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalOpen(false)}>
        <Screen scroll includeBottomInset contentStyle={styles.modalContent}>
          <View style={styles.modalHeader}>
            <AppText variant="title">{editing ? 'Edit category' : 'New category'}</AppText>
            <Button compact variant="ghost" onPress={() => setModalOpen(false)}>
              Close
            </Button>
          </View>
          <TextField label="Name" value={name} onChangeText={setName} maxLength={30} placeholder="Category name" />
          <View style={styles.pickerGroup}>
            <AppText variant="label">Icon</AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerRow}>
              {ICONS.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setIcon(item)}
                  style={[
                    styles.pickerItem,
                    { borderColor: item === icon ? colors.primary : colors.border, backgroundColor: colors.surface },
                  ]}
                >
                  <Ionicons name={item} size={24} color={item === icon ? colors.primary : colors.textMuted} />
                </Pressable>
              ))}
            </ScrollView>
          </View>
          <View style={styles.pickerGroup}>
            <AppText variant="label">Color</AppText>
            <View style={styles.colorGrid}>
              {categoryPalette.map((item) => (
                <Pressable
                  key={item}
                  accessibilityLabel={`Select color ${item}`}
                  onPress={() => setColor(item)}
                  style={[styles.colorItem, { backgroundColor: item, borderColor: item === color ? colors.text : item }]}
                >
                  {item === color ? <Ionicons name="checkmark" size={20} color="#FFFFFF" /> : null}
                </Pressable>
              ))}
            </View>
          </View>
          <Button onPress={() => void save()} loading={saving} disabled={!name.trim()}>
            {editing ? 'Save category' : 'Create category'}
          </Button>
        </Screen>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { gap: spacing.md },
  intro: { gap: spacing.lg, marginBottom: spacing.sm },
  flex: { flex: 1 },
  categoryCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  categoryIcon: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  reorderButtons: { gap: 2 },
  archivedHeading: { marginTop: spacing.lg },
  modalContent: { gap: spacing.xl },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pickerGroup: { gap: spacing.md },
  pickerRow: { gap: spacing.sm },
  pickerItem: { width: 50, height: 50, borderRadius: radius.md, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  colorItem: { width: 46, height: 46, borderRadius: 23, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
});
