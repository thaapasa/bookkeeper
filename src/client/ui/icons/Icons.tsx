import {
  ArrowDownFromLine,
  ArrowUpFromLine,
  BarChart3,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  ChartLine,
  ChartPie,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CirclePlus,
  CircleX,
  Copy,
  Euro,
  Eye,
  EyeOff,
  Hammer,
  Image,
  Infinity as InfinityIcon,
  Info,
  LayoutGrid,
  Link2,
  LogOut,
  type LucideIcon,
  type LucideProps,
  Menu,
  Palette,
  Pencil,
  PencilLine,
  Plus,
  Redo2,
  RefreshCw,
  Repeat,
  Save,
  Search,
  Sun,
  Tags,
  Trash2,
  Upload,
  Wallet,
  X,
  XCircle,
} from 'lucide-react';
import React from 'react';

import { neutral, primary } from '../Colors';

/** Map of icon names to Lucide components */
export const LucideIcons = {
  Add: Plus,
  AddChart: BarChart3,
  AllInclusive: InfinityIcon,
  BarChart: BarChart3,
  Calendar: CalendarDays,
  CalendarEmpty: CalendarRange,
  CalendarRepeat: CalendarClock,
  Cancel: CircleX,
  CancelOutlined: XCircle,
  Category: Tags,
  Chart: ChartLine,
  Check: Check,
  ChevronLeft: ChevronLeft,
  ChevronRight: ChevronRight,
  Clear: X,
  Copy: Copy,
  Delete: Trash2,
  Edit: Pencil,
  EditNote: PencilLine,
  ExpandLess: ChevronUp,
  ExpandMore: ChevronDown,
  Expense: Wallet,
  Grouping: LayoutGrid,
  Hidden: EyeOff,
  Image: Image,
  Income: Euro,
  Info: Info,
  Logout: LogOut,
  Menu: Menu,
  Money: Euro,
  Palette: Palette,
  PieChart: ChartPie,
  PlusCircle: CirclePlus,
  Recurring: RefreshCw,
  Refresh: RefreshCw,
  Repeat: Repeat,
  Save: Save,
  Search: Search,
  Shortcut: Link2,
  SortDown: ArrowDownFromLine,
  SortUp: ArrowUpFromLine,
  Split: ChartPie,
  Subscriptions: Repeat,
  Sun: Sun,
  Today: CalendarDays,
  Tools: Hammer,
  Transfer: Redo2,
  Upload: Upload,
  Visible: Eye,
};

export type Icon = keyof typeof LucideIcons;

/** MUI fontSize compatibility */
type MuiFontSize = 'small' | 'medium' | 'large' | 'inherit';

const fontSizeMap: Record<MuiFontSize, number> = {
  small: 16,
  medium: 18,
  large: 24,
  inherit: 18,
};

/** MUI color compatibility — maps semantic color names to CSS colors */
type MuiIconColor = 'primary' | 'secondary' | 'action' | 'info' | 'warning' | 'inherit' | 'error';

const colorMap: Record<MuiIconColor, string> = {
  primary: primary[5],
  secondary: neutral[4],
  action: 'var(--mantine-color-dimmed)',
  info: 'var(--mantine-color-blue-6)',
  warning: 'var(--mantine-color-orange-6)',
  error: 'var(--mantine-color-red-6)',
  inherit: 'inherit',
};

export interface IconProps extends Omit<LucideProps, 'color' | 'ref'> {
  /** MUI-compatible semantic color or CSS color string */
  color?: MuiIconColor | (string & {});
  /** MUI-compatible font size */
  fontSize?: MuiFontSize;
}

function resolveColor(color: string | undefined): string | undefined {
  if (!color) return undefined;
  return (colorMap as Record<string, string>)[color] ?? color;
}

function resolveSize(fontSize: MuiFontSize | undefined): number {
  return fontSizeMap[fontSize ?? 'medium'];
}

/** Create an icon wrapper component that's compatible with existing usage patterns.
 * Uses width/height="1em" so icons respond to CSS font-size, just like MUI icons did. */
function createIconComponent(LucideComponent: LucideIcon): React.FC<IconProps> {
  const IconWrapper: React.FC<IconProps> = ({ color, fontSize, style, size, ...props }) => {
    const resolvedSize = size ?? resolveSize(fontSize);
    const resolvedColor = resolveColor(color);
    return (
      <LucideComponent
        width="1em"
        height="1em"
        color={resolvedColor}
        style={{
          fontSize: resolvedSize,
          ...style,
          ...(resolvedColor ? { color: resolvedColor } : {}),
        }}
        {...props}
      />
    );
  };
  IconWrapper.displayName = LucideComponent.displayName;
  return IconWrapper;
}

export const Icons: Record<Icon, React.FC<IconProps>> = Object.fromEntries(
  Object.entries(LucideIcons).map(([name, component]) => [name, createIconComponent(component)]),
) as Record<Icon, React.FC<IconProps>>;

export const RenderIcon: React.FC<{ icon?: Icon } & IconProps> = ({ icon, ...props }) => {
  const Item = icon && Icons[icon];
  return Item ? <Item {...props} /> : null;
};
