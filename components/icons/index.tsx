import {
  AlertCircleIcon as AlertCircleStroke,
  Alert02Icon as AlertTriangleStroke,
  ArrowLeftRightIcon as ArrowLeftRightStroke,
  ArrowRightIcon as ArrowRightStroke,
  ArrowUpIcon as ArrowUpStroke,
  AwardIcon as AwardStroke,
  BellIcon as BellStroke,
  Bookmark02Icon as BookmarkStroke,
  BookOpenIcon as BookOpenStroke,
  BriefcaseIcon as BriefcaseStroke,
  Building02Icon as Building2Stroke,
  CalendarIcon as CalendarStroke,
  CheckIcon as CheckStroke,
  CheckmarkCircle02Icon as CheckCircle2Stroke,
  ChevronDownIcon as ChevronDownStroke,
  ChevronRightIcon as ChevronRightStroke,
  CircleIcon as CircleStroke,
  ClipboardCheckIcon as ClipboardCheckStroke,
  ClipboardListIcon as ClipboardListStroke,
  ClockIcon as ClockStroke,
  CompassIcon as CompassStroke,
  CopyIcon as CopyStroke,
  ExternalLinkIcon as ExternalLinkStroke,
  EyeIcon as EyeStroke,
  EyeOffIcon as EyeOffStroke,
  File01Icon as FileTextStroke,
  FolderKanbanIcon as FolderKanbanStroke,
  GlobeIcon as GlobeStroke,
  HandHeartIcon as HandHeartStroke,
  InformationCircleIcon as InfoStroke,
  IdeaIcon as LightbulbStroke,
  Link02Icon as Link2Stroke,
  Loading03Icon as Loader2Stroke,
  LockIcon as LockStroke,
  Logout01Icon as LogOutStroke,
  Mail01Icon as MailStroke,
  MapPinIcon as MapPinStroke,
  MegaphoneIcon as MegaphoneStroke,
  Moon02Icon as MoonStroke,
  MenuIcon as MenuStroke,
  Message01Icon as MessageSquareStroke,
  MessageNotification01Icon as MessageSquareWarningStroke,
  Comment01Icon as MessagesSquareStroke,
  MicIcon as MicStroke,
  MicOffIcon as MicOffStroke,
  Edit02Icon as PenLineStroke,
  PencilIcon as PencilStroke,
  Call02Icon as PhoneStroke,
  PhoneOffIcon as PhoneOffStroke,
  PlusSignIcon as PlusStroke,
  RefreshIcon as RotateCcwStroke,
  SaveIcon as SaveStroke,
  SearchIcon as SearchStroke,
  SentIcon as SendStroke,
  SettingsIcon as SettingsStroke,
  SecurityWarningIcon as ShieldAlertStroke,
  SecurityCheckIcon as ShieldCheckStroke,
  SparklesIcon as SparklesStroke,
  Sun03Icon as SunStroke,
  StarIcon as StarStroke,
  ThumbsDownIcon as ThumbsDownStroke,
  ThumbsUpIcon as ThumbsUpStroke,
  Delete02Icon as Trash2Stroke,
  ChartUpIcon as TrendingUpStroke,
  UploadIcon as UploadStroke,
  UserCircleIcon as UserCircleStroke,
  UserCheckIcon as UserCheckStroke,
  UserAdd01Icon as UserPlusStroke,
  UserMultipleIcon as UsersStroke,
  VideoIcon as VideoStroke,
  VideoOffIcon as VideoOffStroke,
  Cancel01Icon as XStroke,
  CancelCircleIcon as XCircleStroke,
} from "@hugeicons-pro/core-stroke-rounded";
import {
  Bookmark02Icon as BookmarkSolid,
  StarIcon as StarSolid,
} from "@hugeicons-pro/core-solid-rounded";
import { hugeiconsAdapter, type IconComponent } from "./hugeicon";

/**
 * The app's icon set: Hugeicons Pro stroke-rounded, adapted to the plain
 * `(props) => <svg />` shape everything else expects. Names are the app's
 * own, so a call site says what the icon means rather than which record it
 * came from, and swapping the underlying icon is a change here alone.
 *
 * Nav icons are separate — see components/icons/nav-icons.tsx (Figma
 * sourced) and lib/constants/nav.tsx, which pair stroke with solid.
 */
export type { IconComponent };

export const AlertCircle = hugeiconsAdapter(AlertCircleStroke);
export const AlertTriangle = hugeiconsAdapter(AlertTriangleStroke);
export const ArrowLeftRight = hugeiconsAdapter(ArrowLeftRightStroke);
export const ArrowRight = hugeiconsAdapter(ArrowRightStroke);
export const ArrowUp = hugeiconsAdapter(ArrowUpStroke);
export const Award = hugeiconsAdapter(AwardStroke);
export const Bell = hugeiconsAdapter(BellStroke);
export const Bookmark = hugeiconsAdapter(BookmarkStroke);
/** The filled counterpart, for a bookmark that's already been set. */
export const BookmarkFilled = hugeiconsAdapter(BookmarkSolid);
export const BookOpen = hugeiconsAdapter(BookOpenStroke);
export const Briefcase = hugeiconsAdapter(BriefcaseStroke);
export const Building2 = hugeiconsAdapter(Building2Stroke);
export const Calendar = hugeiconsAdapter(CalendarStroke);
export const Check = hugeiconsAdapter(CheckStroke);
export const CheckCircle2 = hugeiconsAdapter(CheckCircle2Stroke);
export const ChevronDown = hugeiconsAdapter(ChevronDownStroke);
export const ChevronRight = hugeiconsAdapter(ChevronRightStroke);
export const Circle = hugeiconsAdapter(CircleStroke);
export const ClipboardCheck = hugeiconsAdapter(ClipboardCheckStroke);
export const ClipboardList = hugeiconsAdapter(ClipboardListStroke);
export const Clock = hugeiconsAdapter(ClockStroke);
export const Compass = hugeiconsAdapter(CompassStroke);
export const Copy = hugeiconsAdapter(CopyStroke);
export const ExternalLink = hugeiconsAdapter(ExternalLinkStroke);
export const Eye = hugeiconsAdapter(EyeStroke);
export const EyeOff = hugeiconsAdapter(EyeOffStroke);
export const FileText = hugeiconsAdapter(FileTextStroke);
export const FolderKanban = hugeiconsAdapter(FolderKanbanStroke);
export const Globe = hugeiconsAdapter(GlobeStroke);
export const HandHeart = hugeiconsAdapter(HandHeartStroke);
export const Info = hugeiconsAdapter(InfoStroke);
export const Lightbulb = hugeiconsAdapter(LightbulbStroke);
export const Link2 = hugeiconsAdapter(Link2Stroke);
export const Loader2 = hugeiconsAdapter(Loader2Stroke);
export const Lock = hugeiconsAdapter(LockStroke);
export const LogOut = hugeiconsAdapter(LogOutStroke);
export const Mail = hugeiconsAdapter(MailStroke);
export const MapPin = hugeiconsAdapter(MapPinStroke);
export const Megaphone = hugeiconsAdapter(MegaphoneStroke);
export const Moon = hugeiconsAdapter(MoonStroke);
export const Menu = hugeiconsAdapter(MenuStroke);
export const MessageSquare = hugeiconsAdapter(MessageSquareStroke);
export const MessageSquareWarning = hugeiconsAdapter(MessageSquareWarningStroke);
export const MessagesSquare = hugeiconsAdapter(MessagesSquareStroke);
export const Mic = hugeiconsAdapter(MicStroke);
export const MicOff = hugeiconsAdapter(MicOffStroke);
export const PenLine = hugeiconsAdapter(PenLineStroke);
export const Pencil = hugeiconsAdapter(PencilStroke);
export const Phone = hugeiconsAdapter(PhoneStroke);
export const PhoneOff = hugeiconsAdapter(PhoneOffStroke);
export const Plus = hugeiconsAdapter(PlusStroke);
export const RotateCcw = hugeiconsAdapter(RotateCcwStroke);
export const Save = hugeiconsAdapter(SaveStroke);
export const Search = hugeiconsAdapter(SearchStroke);
export const Send = hugeiconsAdapter(SendStroke);
export const Settings = hugeiconsAdapter(SettingsStroke);
export const ShieldAlert = hugeiconsAdapter(ShieldAlertStroke);
export const ShieldCheck = hugeiconsAdapter(ShieldCheckStroke);
export const Sparkles = hugeiconsAdapter(SparklesStroke);
export const Sun = hugeiconsAdapter(SunStroke);
export const Star = hugeiconsAdapter(StarStroke);
export const ThumbsDown = hugeiconsAdapter(ThumbsDownStroke);
export const ThumbsUp = hugeiconsAdapter(ThumbsUpStroke);
export const Trash2 = hugeiconsAdapter(Trash2Stroke);
export const TrendingUp = hugeiconsAdapter(TrendingUpStroke);
export const Upload = hugeiconsAdapter(UploadStroke);
export const UserCheck = hugeiconsAdapter(UserCheckStroke);
export const UserCircle = hugeiconsAdapter(UserCircleStroke);
export const UserPlus = hugeiconsAdapter(UserPlusStroke);
export const Users = hugeiconsAdapter(UsersStroke);
export const Video = hugeiconsAdapter(VideoStroke);
export const VideoOff = hugeiconsAdapter(VideoOffStroke);
export const X = hugeiconsAdapter(XStroke);
export const XCircle = hugeiconsAdapter(XCircleStroke);

/**
 * The one solid icon in general use: a stroke star can't show a filled
 * rating, since `fill-current` cannot override the `fill="none"` the
 * stroke variant sets on its own paths.
 */
export const StarFilled = hugeiconsAdapter(StarSolid);
