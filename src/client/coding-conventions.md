# Frontend Coding Conventions

This is the single source of truth for how frontend code should be written in this
project. All new and modified UI code must follow these conventions. When refactoring
legacy code, rewrite from scratch following these rules rather than patching old patterns.

## Technology Stack

- **Framework**: React 19 (functional components only, no class components)
- **UI Library**: Mantine 9
- **Styling**: Mantine style props + CSS modules for complex cases
- **State**: Zustand, TanStack Query (data fetching)
- **Routing**: React Router 7
- **Build**: Vite 8
- **Dates**: Luxon
- **Validation**: Zod
- **Icons**: Lucide React via `src/client/ui/icons/Icons.tsx`

## Components

Use Mantine components over raw HTML or custom wrappers:

- Layout: `Group`, `Stack`, `Flex`, `Box`, `Grid`, `SimpleGrid`
- Text: `Text`, `Title`, `Anchor`
- Actions: `Button`, `ActionIcon`, `UnstyledButton`
- Structure: `Paper`, `Container`, `ScrollArea`, `AppShell`, `Table`
- Navigation: `NavLink`, `Tabs`

Always use functional components with `React.FC<Props>`. Use named exports (not default
exports) for all components and hooks.

### Exposing style props to callers

Custom components should manage their own internal layout but let callers control
external positioning (margins, flex, padding, alignment). Do this by intersecting your
props with the appropriate Mantine props type and spreading the rest onto the root
element:

```tsx
import { Group, GroupProps, Text, Button } from '@mantine/core';

type MyComponentProps = {
  title: string;
  onAction: () => void;
} & GroupProps;

export const MyComponent: React.FC<MyComponentProps> = ({ title, onAction, ...props }) => (
  <Group gap="sm" p="md" {...props}>
    <Text fw={600} fz="lg">{title}</Text>
    <Button onClick={onAction}>Action</Button>
  </Group>
);

// Caller controls positioning:
<MyComponent title="Hello" onAction={fn} flex={1} ml="md" pt="xs" />
```

Use `Omit` when your own props conflict with the Mantine type:

```tsx
type SelectorProps = {
  onChange: (id: number) => void;  // conflicts with BoxProps.onChange
} & Omit<BoxProps, 'onChange'>;
```

This pattern replaces the old approach of accepting `style?: React.CSSProperties` — never
accept a raw `style` prop just for caller positioning.

## Styling Priority

Follow this order of preference for styling:

### 1. Mantine style props (preferred)

Use style props for spacing, colors, typography, sizing, and layout:

```tsx
<Box p="md" bg="gray.1" c="primary.7" w="100%" pos="relative">
  <Group gap="sm" justify="space-between" align="center" wrap="nowrap">
    <Text fz="sm" fw={600} ta="right">Label</Text>
  </Group>
</Box>
```

Common style props: `p`, `px`, `py`, `m`, `mx`, `my`, `fz`, `fw`, `c`, `bg`, `w`, `h`,
`pos`, `top`, `right`, `bottom`, `left`, `ta`, `display`, `flex`, `opacity`.

Responsive props use object syntax: `px={{ base: 0, sm: "md" }}`.

### 2. Mantine component props

Use built-in component props rather than CSS overrides:

```tsx
<Table withRowBorders={false} withTableBorder={false} verticalSpacing="sm" />
<ActionIcon visibleFrom="sm" hiddenFrom="md" />
<Text truncate lineClamp={2} />
```

### 3. Mantine `style` prop (for one-off CSS)

Use for CSS properties not covered by style props:

```tsx
<Box style={{ borderTop: '1px solid var(--mantine-color-default-border)' }} />
<Box style={{ whiteSpace: 'nowrap', cursor: 'pointer' }} />
```

### 4. CSS modules (for complex CSS)

Use CSS modules for pseudo-elements, hover states, complex selectors, animations,
or multi-property patterns reused across a file:

```tsx
import styles from './MyComponent.module.css';
<Box className={styles.container} />
```

## Size Tokens

Always use Mantine size tokens instead of raw pixel values for spacing, padding, margins,
and gaps.

| Token | Pixels | Use for                             |
|-------|--------|-------------------------------------|
| `xs`  | 10px   | Tight spacing, minor padding        |
| `sm`  | 12px   | Compact UI, table cells, small gaps |
| `md`  | 16px   | Default spacing, normal padding     |
| `lg`  | 20px   | Generous spacing, section gaps      |
| `xl`  | 32px   | Large spacing, section separation   |

```tsx
// Do this
<Box p="md" gap="sm" />
<Group gap="xs" px="md" />
<Stack gap="lg" py="xl" />

// Not this
<Box p={16} gap={12} />
<Group gap={10} px={16} />
```

**Exception**: Fixed layout widths in tables or data grids (e.g., column widths like
`w={120}`) are acceptable as raw numbers because they represent specific layout
measurements, not spacing.

## Font Sizes

The app uses smaller-than-default Mantine font sizes:

| Token | Pixels | Use for                           |
|-------|--------|-----------------------------------|
| `xs`  | 10px   | Minor labels, footnotes           |
| `sm`  | 12px   | Dense data tables, secondary text |
| `md`  | 14px   | Normal UI text (default)          |
| `lg`  | 16px   | Emphasis, subheadings             |
| `xl`  | 18px   | Large text                        |

## Colors

Use Mantine color references in component props:

```tsx
// In Mantine c/bg/color props, use dot notation
<Text c="primary.7" />
<Box bg="neutral.1" />
<ActionIcon color="red" />

// In style prop or CSS, use CSS variables
style={{ color: 'var(--mantine-color-primary-7)' }}
style={{ borderColor: 'var(--mantine-color-default-border)' }}
```

Custom theme colors: `primary` (cyan), `neutral` (gray), `action`, `income`.

For light/dark mode, use CSS `light-dark()` function in CSS modules or Mantine's
`darkHidden`/`lightHidden` props for visibility.

Avoid importing from `client/ui/Colors.ts` for values that can be expressed as Mantine
color references. Use `c="primary.7"` instead of `style={{ color: primary[7] }}`.

## Breakpoints

Uses Mantine defaults. `sm` (768px) is the primary mobile/desktop boundary:

| Token | Pixels | Meaning                 |
|-------|--------|-------------------------|
| `xs`  | 576px  | Portrait phone          |
| `sm`  | 768px  | Mobile/desktop boundary |
| `md`  | 992px  | Tablet landscape        |
| `lg`  | 1200px | Desktop                 |
| `xl`  | 1408px | Large desktop           |

For responsive visibility, use Mantine props:

```tsx
<Table.Td visibleFrom="sm">Desktop only</Table.Td>
<ActionIcon hiddenFrom="md">Mobile only</ActionIcon>
```

For conditional rendering, use hooks from `client/ui/hooks/useBreakpoints`:

```tsx
const isMobile = useIsMobile();        // < sm (768px)
const isPortrait = useIsMobilePortrait(); // < xs (576px)
const isTablet = useIsTablet();         // < md (992px)
```

## Theme

- **Definition**: `src/client/ui/theme/mantineTheme.ts`
- **Layout**: `BookkeeperPage.tsx` uses `AppShell` + `Container`
- **Default ActionIcon variant**: `subtle` (set in theme, don't add `variant="subtle"`)

## Icons

Use the icon map from `src/client/ui/icons/Icons.tsx`:

```tsx
import { Icons } from 'client/ui/icons/Icons';

<Icons.Edit />
<Icons.Delete color="red" />
```

To add a new icon: import from `lucide-react`, add to `LucideIcons` map in `Icons.tsx`.

For buttons with icons, use Mantine's `leftSection` prop (not inline children):

```tsx
// Do this
<Button leftSection={<Icons.Add />}>Lisää</Button>

// Not this
<Button><Icons.Add /> Lisää</Button>
```

## State and Data

- **API calls**: `apiConnect` singleton from `client/data/ApiConnect.ts`
- **Data fetching**: TanStack Query (`useQuery`) with query keys from `client/data/queryKeys.ts`
- **Session state**: Zustand store in `client/data/SessionStore.ts` with convenience hooks
  (`useValidSession`, `useCategoryMap`, `useSourceMap`, `useUserData`, etc.)
- **Navigation state**: Zustand store in `client/data/NavigationStore.ts`
- **Notifications**: `notify()` / `notifyError()` from `client/data/NotificationStore.ts`
- **Dialogs**: `UserPrompts.confirm()`, `UserPrompts.promptText()`, `UserPrompts.select()`
- **Mutation postProcess**: Use `invalidateExpenseData()` / `invalidateSubscriptionData()`
  from `client/data/query.ts` to refresh data after mutations

## Design Components

Reusable text components from `client/ui/design/Text`:

- `Title` — Page title with bottom border
- `Subtitle` — Section heading
- `SectionLabel` — Accent-colored label (`fz="sm"`, `c="primary.7"`)
- `DataValue` — Bold right-aligned inline value
- `Caption` — Small dimmed secondary text

## File Naming

- Components: PascalCase (`ExpenseTable.tsx`)
- Hooks: camelCase with `use` prefix (`useAsyncData.ts`)
- CSS modules: same name as component (`ExpenseTable.module.css`)
- Utilities: camelCase (`ClientUtil.ts`)

## Import Conventions

Use path aliases, never relative paths that escape `src/client/`:

```tsx
import { Money } from 'shared/util';
import { Icons } from 'client/ui/icons/Icons';
```

Do not include `.tsx`/`.ts` extensions in imports.

Import order is enforced by eslint-plugin-simple-import-sort:

1. Side effects
2. External packages (`@mantine/core`, `react`, etc.)
3. Internal aliases (`shared/`, `client/`, `server/`)
4. Relative imports (`./`, `../`)

## Exports

Use **named exports** for all components, hooks, and utilities. Do not use default exports.

```tsx
// Do this
export const MyComponent: React.FC<Props> = ...
export const UserSelector: React.FC<Props> = ...

// Not this
export default connect(...)(MyComponent);
export default MyComponent;
```

## Dates and Times

**No JS `Date` objects.** Use Luxon `DateTime` for computation, branded string types
(`ISODate`, `ISOMonth`, `ISOTimestamp`) for data that flows through props or API calls.

- Use `DateTime.now()` or `toISODate()` for "today" — never `new Date()`
- Mantine date pickers accept ISO date strings directly — no conversion to `Date` needed
- Validate URL date parameters against the type's regexp before casting to branded types
  (e.g., `ISOMonth`). Fall back to a sensible default on invalid input.
- Don't round-trip through `Date`: if a value starts as a string and consumers need a
  string, keep it as a string

## Patterns to Avoid

Do not introduce these patterns in new code:

- `style?: React.CSSProperties` for caller positioning — use Mantine props intersection
- Inline `style={{}}` for margins/padding — use Mantine style props
- Raw pixel values for spacing — use size tokens
- Raw `<div>`/`<span>` for layout — use Mantine `Box`, `Group`, `Stack`, `Flex`

## After Making Changes

Always run `bun format` then `bun lint` to verify.
