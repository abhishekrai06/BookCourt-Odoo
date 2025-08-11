import type { NavItemConfig } from "@/types/nav";
import { paths } from "@/paths";

export const navItems = [
	{ key: "overview", title: "Overview", href: paths.dashboard.overview, icon: "chart-pie" },
	{ key: "venues", title: "Venues", href: paths.dashboard.venues, icon: "users" },
	{ key: "bookings", title: "Bookings", href: paths.dashboard.bookings, icon: "calendar" },
	{ key: "settings", title: "Settings", href: paths.dashboard.settings, icon: "gear-six" },
] satisfies NavItemConfig[];
