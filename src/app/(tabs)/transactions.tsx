import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, SectionList, StyleSheet, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { EntryRow } from '@/components/entries/entry-row';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DateRangeSelector } from '@/components/ui/date-range-selector';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { useDataRevision } from '@/db/data-context';
import { listCategories } from '@/db/repositories/categories';
import { listEntries } from '@/db/repositories/entries';
import { useAsyncData } from '@/hooks/use-async-data';
import { exportLedgerCsv } from '@/services/csv-export';
import { spacing } from '@/theme/tokens';
import { useAppTheme } from '@/theme/use-app-theme';
import type { EntryFilters, EntryType } from '@/types';
import { formatEntryDate, getDateRange } from '@/utils/dates';

const PAGE_SIZE = 50;

export default function TransactionsScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { revision } = useDataRevision();
  const { colors } = useAppTheme();
  const [range, setRange] = useState(() => getDateRange('month'));
  const [type, setType] = useState<EntryType | 'all'>('all');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [exporting, setExporting] = useState(false);

  const filters: EntryFilters = {
    dateRange: range,
    type,
    categoryId,
    search,
    limit,
  };

  const result = useAsyncData(
    async () => ({ entries: await listEntries(db, filters), categories: await listCategories(db) }),
    { entries: [], categories: [] },
    `${range.startDate}:${range.endDate}:${type}:${categoryId ?? ''}:${search}:${limit}:${revision}`,
  );

  const entries = result.data.entries;
  const sections = useMemo(() => {
    const groups = new Map<string, typeof entries>();
    for (const entry of entries) {
      const current = groups.get(entry.entryDate) ?? [];
      current.push(entry);
      groups.set(entry.entryDate, current);
    }
    return Array.from(groups.entries()).map(([date, entries]) => ({
      title: formatEntryDate(date),
      date,
      data: entries,
    }));
  }, [entries]);

  const onExport = async () => {
    setExporting(true);
    try {
      await exportLedgerCsv(db, { ...filters, limit: undefined, offset: undefined });
    } catch (error) {
      Alert.alert('Couldn’t export CSV', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Screen contentStyle={styles.screen}>
      <SectionList
        sections={sections}
        keyExtractor={(entry) => entry.id}
        keyboardShouldPersistTaps="handled"
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <View style={styles.titleRow}>
              <View>
                <AppText variant="title">Transactions</AppText>
                <AppText color="muted">Search and filter your complete ledger.</AppText>
              </View>
              <Button compact variant="ghost" icon="download-outline" loading={exporting} onPress={() => void onExport()}>
                CSV
              </Button>
            </View>

            <View style={styles.actions}>
              <View style={styles.action}>
                <Button icon="remove-circle-outline" onPress={() => router.push('/add-expense')}>
                  Expense
                </Button>
              </View>
              <View style={styles.action}>
                <Button icon="add-circle-outline" variant="secondary" onPress={() => router.push('/add-credit')}>
                  Credit
                </Button>
              </View>
            </View>

            <DateRangeSelector
              value={range}
              onChange={(next) => {
                setRange(next);
                setLimit(PAGE_SIZE);
              }}
            />

            <TextField
              label="Search notes"
              placeholder="Lunch, refund, rent…"
              value={search}
              onChangeText={(value) => {
                setSearch(value);
                setLimit(PAGE_SIZE);
              }}
            />

            <View style={styles.filterGroup}>
              <AppText variant="label">Entry type</AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
                {(['all', 'expense', 'credit'] as const).map((value) => (
                  <Button
                    key={value}
                    compact
                    variant={type === value ? 'primary' : 'ghost'}
                    onPress={() => {
                      setType(value);
                      if (value === 'credit') setCategoryId(null);
                      setLimit(PAGE_SIZE);
                    }}
                  >
                    {value === 'all' ? 'All' : value === 'expense' ? 'Expenses' : 'Credits'}
                  </Button>
                ))}
              </ScrollView>
            </View>

            {type !== 'credit' ? (
              <View style={styles.filterGroup}>
                <AppText variant="label">Category</AppText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
                  <Button
                    compact
                    variant={categoryId === null ? 'primary' : 'ghost'}
                    onPress={() => setCategoryId(null)}
                  >
                    All
                  </Button>
                  {result.data.categories.map((category) => (
                    <Button
                      key={category.id}
                      compact
                      variant={categoryId === category.id ? 'primary' : 'ghost'}
                      onPress={() => {
                        setCategoryId(category.id);
                        setLimit(PAGE_SIZE);
                      }}
                    >
                      {category.name}
                    </Button>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            <View style={styles.resultsHeading}>
              <AppText variant="heading">{range.label}</AppText>
              <AppText variant="caption" color="muted">
                {result.data.entries.length} shown
              </AppText>
            </View>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
            <AppText variant="label" color="muted">
              {section.title}
            </AppText>
          </View>
        )}
        renderItem={({ item }) => (
          <Card style={styles.entryCard} padded={false}>
            <EntryRow
              entry={item}
              onPress={() => router.push({ pathname: '/edit-entry', params: { id: item.id } })}
            />
          </Card>
        )}
        ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
        SectionSeparatorComponent={() => <View style={styles.sectionSeparator} />}
        ListEmptyComponent={
          result.loading ? (
            <LoadingState label="Loading transactions…" />
          ) : result.error ? (
            <ErrorState message={result.error.message} onRetry={() => void result.refresh()} />
          ) : (
            <EmptyState title="No matching entries" message="Try another filter or add your first expense or credit." />
          )
        }
        ListFooterComponent={
          result.data.entries.length >= limit ? (
            <View style={styles.loadMore}>
              <Button variant="ghost" onPress={() => setLimit((value) => value + PAGE_SIZE)}>
                Load more
              </Button>
            </View>
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 0 },
  listContent: { paddingBottom: 120 },
  headerContent: { gap: spacing.lg, paddingBottom: spacing.lg },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.md },
  action: { flex: 1 },
  filterGroup: { gap: spacing.sm },
  pills: { gap: spacing.sm, paddingRight: spacing.lg },
  resultsHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionHeader: { paddingTop: spacing.md, paddingBottom: spacing.sm },
  entryCard: { paddingHorizontal: spacing.md },
  itemSeparator: { height: spacing.sm },
  sectionSeparator: { height: spacing.sm },
  loadMore: { marginTop: spacing.xl },
});
