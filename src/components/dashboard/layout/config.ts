import type { NavItemConfig } from "@/types/nav";
import { paths } from "@/paths";

export const navItems = [
	{ key: "overview", title: "Overview", href: paths.dashboard.overview, icon: "chart-pie" },

	{ key: "settings", title: "Settings", href: paths.dashboard.settings, icon: "gear-six" },
] satisfies NavItemConfig[];
