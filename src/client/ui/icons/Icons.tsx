import AddIcon from '@mui/icons-material/Add';
import AddChartIcon from '@mui/icons-material/Addchart';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import AppShortcutIcon from '@mui/icons-material/AppShortcut';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import AutoRenewIcon from '@mui/icons-material/Autorenew';
import BarChartIcon from '@mui/icons-material/BarChart';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CancelIcon from '@mui/icons-material/Cancel';
import CategoryIcon from '@mui/icons-material/Category';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ClearIcon from '@mui/icons-material/Clear';
import CollectionsBookmarkIcon from '@mui/icons-material/CollectionsBookmark';
import ConstructionIcon from '@mui/icons-material/Construction';
import DeleteIcon from '@mui/icons-material/Delete';
import DonutSmallIcon from '@mui/icons-material/DonutSmall';
import EditIcon from '@mui/icons-material/Edit';
import EditNoteIcon from '@mui/icons-material/EditNote';
import EuroIcon from '@mui/icons-material/Euro';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import ImageIcon from '@mui/icons-material/Image';
import InfoIcon from '@mui/icons-material/Info';
import SortDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import SortUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp';
import MenuIcon from '@mui/icons-material/Menu';
import PaletteIcon from '@mui/icons-material/Palette';
import PaymentIcon from '@mui/icons-material/Payment';
import PieChartIcon from '@mui/icons-material/PieChart';
import RedoIcon from '@mui/icons-material/Redo';
import RefreshIcon from '@mui/icons-material/Refresh';
import RepeatIcon from '@mui/icons-material/Repeat';
import SearchIcon from '@mui/icons-material/Search';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import TodayIcon from '@mui/icons-material/Today';
import UploadIcon from '@mui/icons-material/Upload';
import HiddenIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibleIcon from '@mui/icons-material/VisibilityOutlined';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import { SvgIconProps } from '@mui/material';
import React from 'react';

export const Icons = {
  Add: AddIcon,
  AddChart: AddChartIcon,
  BarChart: BarChartIcon,
  Calendar: CalendarMonthIcon,
  CalendarEmpty: CalendarTodayIcon,
  CalendarRepeat: EventRepeatIcon,
  Cancel: CancelIcon,
  Category: CategoryIcon,
  Chart: AutoGraphIcon,
  ChevronLeft: ChevronLeftIcon,
  ChevronRight: ChevronRightIcon,
  Clear: ClearIcon,
  Copy: FileCopyIcon,
  Delete: DeleteIcon,
  Edit: EditIcon,
  EditNote: EditNoteIcon,
  ExpandLess: ExpandLessIcon,
  ExpandMore: ExpandMoreIcon,
  Expense: PaymentIcon,
  Grouping: CollectionsBookmarkIcon,
  Hidden: HiddenIcon,
  Image: ImageIcon,
  Income: AttachMoneyIcon,
  Info: InfoIcon,
  Menu: MenuIcon,
  Money: EuroIcon,
  Palette: PaletteIcon,
  PieChart: PieChartIcon,
  PlusCircle: AddCircleIcon,
  Recurring: AutoRenewIcon,
  Refresh: RefreshIcon,
  Repeat: RepeatIcon,
  Search: SearchIcon,
  Shortcut: AppShortcutIcon,
  SortDown: SortDownIcon,
  SortUp: SortUpIcon,
  Split: DonutSmallIcon,
  Subscriptions: SubscriptionsIcon,
  Sun: WbSunnyIcon,
  Today: TodayIcon,
  Tools: ConstructionIcon,
  Transfer: RedoIcon,
  Upload: UploadIcon,
  Visible: VisibleIcon,
};

export type Icon = keyof typeof Icons;

export const RenderIcon: React.FC<{ icon?: Icon } & SvgIconProps> = ({ icon, ...props }) => {
  const Item = icon && Icons[icon];
  return Item ? <Item {...props} /> : null;
};
