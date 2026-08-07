import {
  Award,
  Camera,
  QrCode,
  LayoutDashboard,
  Images,
  ImageUp,
  MonitorPlay,
  ScanLine,
  ScrollText,
  Settings,
  Users,
  UsersRound,
  UtensilsCrossed,
  ChartColumnBig,
  Presentation,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  group: "Operations" | "Live" | "Records" | "System";
}

export const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Operations" },
  { href: "/registration", label: "Registration", icon: ScanLine, group: "Operations" },
  { href: "/stage", label: "Stage", icon: Award, badge: "3", group: "Operations" },
  { href: "/booth", label: "Photo Booth", icon: Camera, group: "Operations" },
  { href: "/qr-cards", label: "QR Passes", icon: QrCode, group: "Operations" },

  { href: "/queue", label: "Queue Monitor", icon: Presentation, badge: "47", group: "Live" },
  { href: "/display", label: "TV Display", icon: MonitorPlay, group: "Live" },

  { href: "/lunch", label: "Lunch", icon: UtensilsCrossed, group: "Operations" },
  { href: "/certificates", label: "Certificates", icon: ScrollText, group: "Operations" },

  { href: "/photos", label: "Photo Import", icon: ImageUp, group: "Records" },
  { href: "/gallery", label: "Media Gallery", icon: Images, group: "Records" },
  { href: "/students", label: "Students", icon: Users, group: "Records" },
  { href: "/volunteers", label: "Volunteers", icon: UsersRound, group: "Records" },
  { href: "/reports", label: "Reports", icon: ChartColumnBig, group: "Records" },

  { href: "/settings", label: "Settings", icon: Settings, group: "System" },
];

/** Order the sidebar renders its sections in. */
export const NAV_GROUPS: NavItem["group"][] = ["Operations", "Live", "Records", "System"];

/** The five destinations volunteers reach for on a phone. */
export const MOBILE_NAV = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/registration", label: "Scan", icon: ScanLine },
  { href: "/queue", label: "Queue", icon: Presentation },
  { href: "/booth", label: "Booth", icon: Camera },
  { href: "/students", label: "Students", icon: Users },
];
