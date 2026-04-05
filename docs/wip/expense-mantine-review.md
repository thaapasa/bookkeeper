# Expense Directory Mantine Review

Code review of `src/client/ui/expense/` — findings for migrating remaining legacy
patterns to idiomatic Mantine 8. Reviewed 2026-03-28.

## 1. Legacy `styled` wrappers still used where Mantine suffices

### ExpenseDialog.tsx (HIGH — class component + 7 styled wrappers)

The biggest single legacy item. Class component with Bacon.js form streams and 7
styled wrappers:

- `Form` — flex column → `Stack` or `<form>` with Mantine style props
- `Row` — flex row with hardcoded `height: 80px` + className-based variants (`&.source`,
  `&.parent`, `&.division`, `&.date`) → Mantine `Group` with per-row props
- `TodayButton` — `margin-left: 16px; top: 1px` → `Box ml="md"`
- `DialogActions` — flex row, gap 8px, padding-top 16px → `Group justify="flex-end" gap="sm" pt="md"`
- `OwnerSelectorArea` — absolute positioning, shadow, conditional visibility → Mantine
  `Popover` or `Box` with pos/display props
- `SumArea`, `ConfirmArea` — `margin-left: 1em; display: inline-block` → `Box ml="md"`
- `TypeArea` — `width: 92px; display: inline-block` → `Box w={92}`

The form layout uses CSS className strings (`"row sum parent"`, `"row input title"`) for
conditional styling — replace with per-row Mantine props.

### ExpenseDialogComponents.tsx

- `SumArea` (inline-flex row) → `Group`
- `ExpenseDialogContent` (overflow-y, padding, conditional borders) → `Box` with
  conditional `style` for borders, `px="lg" py="md"`

### CategorySelector.tsx

- `Row` (flex row with gap: 16px) → `Group gap="md"`
- `SelectWrapper` (width: 100%) → `Box flex={1}` or just remove wrapper

### GroupingSelector.tsx

- `Container` (position: relative, width: 100%) → `Box pos="relative" w="100%"`
- `IconPosition` (position: absolute, right: 0, top: 0) → `Box pos="absolute" right={0} top={0}`

### SplitRow.tsx

- `SplitGrid` (CSS grid 12-col) — legitimate CSS, keep as CSS module
- `RelDiv` (position: relative) → `Box pos="relative"`
- `FootNote` (absolute + transform scale) — legitimate CSS for the scale transform, keep
  but move to CSS module

### SplitButtons.tsx

- `ButtonGrid` (3-column grid) → `Group justify="space-between"`

### ExpenseSplitDialog.tsx

- `SplitGrid` (12-col grid) — same pattern as SplitRow, consolidate into one CSS module

## 2. Raw pixel values instead of Mantine size tokens

| Location | Current | Suggested |
|----------|---------|-----------|
| `ExpenseTable.tsx:151` | `px={{ base: 0, sm: 16 }}` | `px={{ base: 0, sm: "md" }}` |
| `RecurringSummaryRow.tsx:55,62,69` | `px={8}` | `px="xs"` |
| `ExpenseInfo.tsx:47` | `p="12px 16px"` | `px="md" py="sm"` |
| `RecurrenceInfo.tsx:12` | `p="12px 16px"` | `px="md" py="sm"` |
| `SpecialRows.tsx:10` | `style={{ height: 24 }}` | `h={24}` Mantine prop (or named constant) |
| `ExpenseInfo.tsx:34` | `divisionMl` = 46/80/82 raw pixels | Consider responsive Mantine spacing |

Table column widths in `ExpenseHeader.tsx`, `DivisionInfo.tsx`, `MonthlyStatus.tsx` use
raw pixels — acceptable for fixed-layout tables but could be named constants.

## 3. Inline style={{}} where Mantine props exist

| Location | Current | Suggested |
|----------|---------|-----------|
| `ExpenseRow.tsx:249` | `style={{ color: forMoney(...) }}` | `c={forMoney(...)}` |
| `ExpenseRow.tsx:80` | `style={{ color: action }}` | `c="action"` or `c="primary.7"` |
| `ExpenseTableLayout.tsx:24` | `style={{ opacity: 0.4 }}` | `opacity={0.4}` |
| `ExpenseTableLayout.tsx:25` | `padding: '0 var(--mantine-spacing-md)'` | `px="md"` |
| `SpecialRows.tsx:10` | `style={{ backgroundColor: '...' }}` | `bg="neutral.1"` |
| `ExpenseDialogComponents.tsx:51` | `<div style={{ width: '100%' }}>` | `<Box w="100%">` |
| `MonthlyStatus.tsx:117` | `style={{ ...style, position: 'relative' }}` | `pos="relative"` (already available) |
| `SplitRow.tsx` (many) | `<div style={{ gridColumn: 'span N' }}>` | `<Box>` for consistency |

## 4. File organization / naming

- **`Breakpoints.tsx`** — Contains expense table column visibility constants + `AllColumns`.
  Name suggests generic breakpoints. Rename to `ExpenseTableColumns.tsx`.
- **`TableIcons.tsx`** — Vague name. Exports `RecurringExpenseIcon`, `UnconfirmedIcon`,
  `IconToolArea`. `IconToolArea` is only used in `ExpenseRow` and is a trivial `Group` —
  inline it.
- **`ExpenseRowComponents.tsx`** — Contains `SourceIcon` and `TextButton`. `TextButton` is
  reusable beyond this file (also used in `SplitRow`). Consider moving to `component/`.
- **`SpecialRows.tsx`** — "Special" is vague. Contains `RecurringExpenseSeparator` and
  `LoadingIndicator`. Consider more descriptive name or merge into consuming files.
- **`ExpenseDialogComponents.tsx`** — Grab bag of `SumField`, `SourceSelector`,
  `TypeSelector`, `DescriptionField`, `SumArea`, `ExpenseDialogContent`.
- **`ExpenseInfoTools.tsx`** — Interface is named `RecurrenceInfoProps` but the component
  is `ExpenseInfoTools`. Rename interface to `ExpenseInfoToolsProps`.

## 5. Minor issues

- **`.tsx` extensions in imports**: `ExpenseRow.tsx:25`, `TableIcons.tsx:3`, and others
  use `from 'client/ui/icons/Icons.tsx'` — inconsistent, remove extensions.
- **`Colors.ts` imports**: `ExpenseRow.tsx` imports `action`, `primary` as JS objects to
  use in `style={{}}` — could use Mantine color references directly (`c="primary.7"`).
- **`ExpenseTable.module.css`**: `.container` has `min-height: calc(100vh - 56px)` with
  hardcoded 56px AppShell header height.
- **`light-dark()` in Mantine prop** (`ExpenseInfo.tsx:41`): Complex CSS function string
  in `bg` prop — move to CSS module like the footer does.

## Priority

| Priority | Issue | Files |
|----------|-------|-------|
| High | ExpenseDialog: class component + styled wrappers | `ExpenseDialog.tsx` |
| High | Styled wrappers for trivial layout | `CategorySelector`, `GroupingSelector`, `ExpenseDialogComponents`, `SplitRow`, `SplitButtons`, `ExpenseSplitDialog` |
| Medium | Raw pixel values where Mantine tokens work | `ExpenseTable`, `RecurringSummaryRow`, `ExpenseInfo`, `RecurrenceInfo`, `SpecialRows` |
| Medium | Inline style where Mantine props exist | `ExpenseRow`, `ExpenseTableLayout`, `SpecialRows`, `SourceSelector` |
| Medium | Misleading file/type names | `Breakpoints.tsx`, `TableIcons.tsx`, `SpecialRows.tsx`, `RecurrenceInfoProps` |
| Low | .tsx extensions in imports | Several files |
| Low | Colors.ts imports → Mantine color refs | `ExpenseRow`, `DivisionInfo` |
