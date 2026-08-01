# AmountTracker

AmountTracker is an Android-first, local-first personal expense tracker built with Expo and React Native. Credits, expenses, categories, settings, reminders, and backup metadata are stored in SQLite on the device. No account, backend, subscription, or internet connection is required for normal use.

## What is included

- Generic credit and categorized expense create, edit, and delete flows.
- Balance calculated from the ledger: all credits minus all expenses.
- Dashboard totals for today and a selected reporting period.
- Today, Monday–Sunday week, current month, previous month, and custom date filters.
- Category and daily spending charts, average daily spend, top category, and recent entries.
- Combined transaction ledger with date, type, category, and note filters.
- Editable categories with color, icon, ordering, archiving, and safe deletion rules.
- Android local reminders on days with no expense, including a test action and deep link.
- Versioned JSON backup/restore and filtered CSV sharing.
- Light and dark themes, strict TypeScript, unit/component tests, and a Maestro smoke flow.

The current balance is deliberately not stored. Every screen derives it from ledger entries so edits and deletes cannot leave a stale balance.

## Technology

- Expo SDK 57, React Native, TypeScript, and Expo Router.
- `expo-sqlite` with WAL, foreign keys, forward-only migrations, and parameterized SQL.
- React Hook Form and Zod for entry validation.
- `react-native-svg` for small, dependency-light dashboard charts.
- `expo-notifications` for local Android notifications.
- Expo FileSystem, Sharing, and DocumentPicker for backup and export.
- Jest, jest-expo, React Native Testing Library, and Maestro.

## Run the project

Requirements: Node.js, pnpm, the Expo Go app for early UI/data testing, and an Android phone or emulator.

```bash
pnpm install
pnpm start
```

Scan the QR code with Expo Go while the computer and phone are on the same network. Press `a` in the terminal to open an Android emulator.

Most application behavior works in Expo Go. For reliable notification and installed-app testing, use a development APK because native notification behavior is limited by the Expo Go container:

```bash
pnpm exec eas login
pnpm exec eas build --platform android --profile development
```

Install the returned APK, then start Metro for the development client:

```bash
pnpm start -- --dev-client
```

## Quality checks

```bash
pnpm check
```

This runs linting, strict TypeScript checking, and all Jest tests. To run one layer:

```bash
pnpm lint
pnpm typecheck
pnpm test
```

The installed-app smoke flow is at `tests/maestro/smoke.yaml`. With Maestro installed and an Android build running:

```bash
maestro test tests/maestro/smoke.yaml
```

## Incremental learning path

Each stage ends with a small manual test. Commit your work after a stage passes so you always have a stable checkpoint.

### 1. Foundation and navigation

Start at `src/app/_layout.tsx`, then inspect `src/app/(tabs)/_layout.tsx`, `src/theme`, and `src/components/ui`. Run the app and visit Dashboard, Transactions, Settings, Add Expense, and Add Credit. Toggle the device theme and check keyboard and back behavior.

### 2. SQLite and credits

Read `src/db/schema.ts`, `src/db/migrations.ts`, and `src/db/repositories/entries.ts`. Add a ₹10,000 credit, restart the app, edit it to ₹12,000, and then delete it. The balance should follow every operation and survive the restart.

While developing, open Expo's developer menu and use the SQLite inspector to examine `amount-tracker.db` directly.

### 3. Categories and expenses

Read `src/db/seed.ts`, `src/features/entries/mutations.ts`, and the expense route. Add a ₹10,000 credit and ₹250 Food expense. Confirm ₹9,750, edit the expense to ₹300, move its date, and delete it.

### 4. Ledger and filters

Read `src/app/(tabs)/transactions.tsx` and the repository filter builder. Create entries across dates and categories. Combine type, category, note, and date filters. Confirm weeks begin on Monday and date endpoints are inclusive.

### 5. Dashboard

Read the dashboard repository and `src/app/(tabs)/index.tsx`. Compare cards and charts with a small data set calculated by hand. The top balance remains all-time while reporting cards follow the selected period.

### 6. Reminders

Use a development APK. Enable reminders and temporarily choose a time one or two minutes ahead. Verify that no expense produces a notification, a credit does not suppress it, an expense does suppress it, and deleting today's only expense restores it. Tapping a notification should open Add Expense.

The scheduler keeps a rolling 60-day window current whenever the app launches or returns to the foreground.

### 7. Backup and export

Export JSON from Settings, delete sample data, and restore it. Compare categories, entries, settings, and balance. Try an invalid JSON document and confirm current data is unchanged. Export CSV and open it in a spreadsheet application.

### 8. Private APK

Create an installable private preview APK:

```bash
pnpm exec eas build --platform android --profile preview
```

Install it on the physical phone and test with airplane mode enabled. Installing a newer APK with the same Android package preserves SQLite data; uninstalling the app or clearing its storage does not. Keep JSON backups outside the phone.

## Project map

```text
src/
├── app/                 routes, screens, and navigation
├── components/          reusable UI, entry rows, and charts
├── db/                  schema, migrations, seed data, repositories
├── features/            business rules around ledger mutations
├── hooks/               reusable React hooks
├── services/            notifications, backup, and CSV/device APIs
├── theme/               colors, spacing, and theme selection
├── types/               shared domain interfaces
└── utils/               currency and local-date helpers
tests/
├── unit/                pure function tests
├── components/          rendered component tests
└── maestro/             installed Android flow
```

Screens coordinate presentation and navigation. Repositories own SQL, feature modules own business rules, and services isolate device APIs. This separation makes each layer easier to learn and test.

## Data and reminder notes

- Amounts are positive integer paise in SQLite, avoiding floating-point money errors.
- Dates are local `YYYY-MM-DD`; timestamps are UTC ISO strings.
- Expenses may create a negative balance and are never blocked.
- Credits never count as completing the daily expense reminder.
- Categories used by expenses can be archived but cannot be permanently deleted.
- Restore validates the complete backup before replacing data in one transaction and creates a safety file first.
- Notification permission may be disabled later in Android system settings; the app cannot override that choice.

## Release configuration

`eas.json` contains:

- `development`: internal development-client APK.
- `preview`: private standalone APK for personal installation.
- `production`: Play Store-style production build for future use.

The Android application ID is `com.john.amounttracker`. Keep it unchanged to preserve upgrade compatibility.

## MVP boundary and future ideas

This version is single-device, Android-first, local-only, INR-only, and intentionally has no authentication. Natural later additions include budgets, recurring templates, payment methods, multiple accounts and transfers, savings goals, receipt OCR, widgets, biometric locking, encrypted cloud backup/sync, bill reminders, unusual-spend insights, multiple currencies, and iOS release.
