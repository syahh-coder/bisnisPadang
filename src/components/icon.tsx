import type { SVGProps } from "react";

export type IconName =
  | "home"
  | "search"
  | "account"
  | "store"
  | "back"
  | "phone"
  | "chat"
  | "close"
  | "check"
  | "clock"
  | "mapPin"
  | "star"
  | "sparkles"
  | "externalLink"
  | "plus"
  | "minus"
  | "trash"
  | "edit"
  | "share"
  | "shoppingBag"
  | "filter"
  | "qrCode"
  | "shieldCheck"
  | "info"
  | "alertCircle"
  | "calendar"
  | "user"
  | "copy"
  | "chevronLeft"
  | "chevronRight"
  | "chevronDown"
  | "arrowRight"
  | "utensils"
  | "coffee"
  | "briefcase"
  | "layoutGrid"
  | "truck"
  | "link"
  | "tag"
  | "trendingUp"
  | "wallet"
  | "zap"
  | "refresh";

/**
 * Authentic Iconsax Linear SVG Path Definitions
 * 24x24 viewBox, stroke-width 1.5-1.6, round joins & caps
 */
const paths: Record<IconName, React.ReactNode> = {
  home: (
    <>
      <path d="M9.02 2.84 3.63 7.04c-.72.56-1.18 1.76-1.18 2.67v8.08c0 2.21 1.79 4 4 4h11.1c2.21 0 4-1.79 4-4V9.71c0-.91-.46-2.11-1.18-2.67l-5.39-4.2c-1.37-1.07-3.59-1.07-4.96 0Z" />
      <path d="M12 17.99V14.99c0-1.1-.9-2-2-2s-2 .9-2 2v3" />
    </>
  ),
  search: (
    <>
      <path d="M11.5 21a9.5 9.5 0 1 0 0-19 9.5 9.5 0 0 0 0 19Z" />
      <path d="M22 22l-2-2" />
    </>
  ),
  account: (
    <>
      <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" />
      <path d="M20.59 22c0-3.87-3.85-7-8.59-7s-8.59 3.13-8.59 7" />
    </>
  ),
  store: (
    <>
      <path d="M2.5 9.5h19" />
      <path d="M4 9.5v8.5a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V9.5" />
      <path d="M3.24 6.94 4.54 3.7c.33-.82 1.34-1.45 2.23-1.45h10.46c.89 0 1.9.63 2.23 1.45l1.3 3.24c.73 1.83-.58 3.56-2.54 3.56H4.78c-1.96 0-3.27-1.73-2.54-3.56Z" />
      <path d="M10 16.5h4" />
    </>
  ),
  back: (
    <>
      <path d="M9.57 5.93 3.5 12l6.07 6.07" />
      <path d="M20.5 12H3.67" />
    </>
  ),
  phone: (
    <path d="M21.97 18.33c0 .36-.08.73-.25 1.09-.17.36-.39.7-.7 1.02-.49.5-1.07.86-1.73 1.07-.66.21-1.39.32-2.18.32-1.16 0-2.39-.28-3.69-.85a21.46 21.46 0 0 1-4.04-2.45c-1.44-1.12-2.73-2.41-3.85-3.85a21.46 21.46 0 0 1-2.45-4.04C2.5 9.38 2.22 8.16 2.22 7c0-.78.1-1.51.31-2.17.21-.66.57-1.24 1.07-1.74.62-.62 1.39-.96 2.25-.96.34 0 .68.07 1 .22.32.15.59.38.8.69l2.48 3.5c.2.29.32.57.36.83.04.26-.03.52-.2.78l-1.08 1.34c.48.97 1.15 1.95 2.01 2.92.86.86 1.84 1.53 2.92 2.01l1.3-1.11c.26-.22.53-.33.81-.33.28 0 .56.09.84.27l3.59 2.53c.31.21.53.47.67.78.14.3.2.62.2.95Z" />
  ),
  chat: (
    <path d="M8.5 19H8c-4.14 0-6.5-2.36-6.5-6.5V12C1.5 7.03 5.03 3.5 10 3.5h4c4.97 0 8.5 3.53 8.5 8.5s-3.53 8.5-8.5 8.5h-4l-1.5 1.5Z" />
  ),
  close: (
    <path d="m18 6-12 12M6 6l12 12" />
  ),
  check: (
    <path d="m5 12 4.5 4.5L19 7" />
  ),
  clock: (
    <>
      <path d="M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10Z" />
      <path d="M12 7v5.2l3.47 2.08" />
    </>
  ),
  mapPin: (
    <>
      <path d="M12 13.43a3.15 3.15 0 1 0 0-6.3 3.15 3.15 0 0 0 0 6.3Z" />
      <path d="M3.62 8.49c1.97-8.66 14.8-8.65 16.76 0 1.15 5.08-2.01 9.38-4.78 12.04a5.67 5.67 0 0 1-7.2 0c-2.76-2.66-5.92-6.96-4.78-12.04Z" />
    </>
  ),
  star: (
    <path d="m13.73 3.51 1.76 3.76c.25.54.94.94 1.53.99l3.29.28c2 .17 2.47 1.62 1.03 3.04l-2.54 2.51c-.46.46-.71 1.34-.57 1.97l.73 3.16c.55 2.39-.73 3.32-2.84 2.06l-3.08-1.83c-.58-.35-1.53-.35-2.11 0l-3.08 1.83c-2.11 1.26-3.39.33-2.84-2.06l.73-3.16c.14-.63-.11-1.51-.57-1.97L1.67 11.58c-1.44-1.42-.97-2.87 1.03-3.04l3.29-.28c.59-.05 1.28-.45 1.53-.99l1.76-3.76c.98-2.02 2.57-2.02 3.45 0Z" />
  ),
  sparkles: (
    <>
      <path d="m7.5 3 1.22 3.04c.31.78.94 1.41 1.72 1.72L13.5 9l-3.06 1.24c-.78.31-1.41.94-1.72 1.72L7.5 15l-1.22-3.04c-.31-.78-.94-1.41-1.72-1.72L1.5 9l3.06-1.24c.78-.31 1.41-.94 1.72-1.72L7.5 3Z" />
      <path d="m18 13 .81 2.03c.21.52.63.94 1.15 1.15L22 17l-2.04.82c-.52.21-.94.63-1.15 1.15L18 21l-.81-2.03c-.21-.52-.63-.94-1.15-1.15L14 17l2.04-.82c.52-.21.94-.63 1.15-1.15L18 13Z" />
    </>
  ),
  externalLink: (
    <>
      <path d="M13.06 10.94 21 3m0 0h-6.36M21 3v6.36" />
      <path d="M11 4H7.5A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5V13" />
    </>
  ),
  plus: (
    <path d="M12 5v14M5 12h14" />
  ),
  minus: (
    <path d="M6 12h12" />
  ),
  trash: (
    <>
      <path d="M21 5.98c-3.33-.33-6.68-.5-10.02-.5-1.98 0-3.96.1-5.94.3L3 5.98M8.5 4.97l.22-1.31C8.88 2.71 9.5 2 10.59 2h2.82c1.09 0 1.72.74 1.87 1.68l.22 1.29M18.85 9.14l-.65 10.07C18.09 20.78 17.5 22 15.21 22H8.79C6.5 22 5.91 20.78 5.8 19.21L5.15 9.14" />
      <path d="M10.33 16.5h3.33M9.5 12.5h5" />
    </>
  ),
  edit: (
    <>
      <path d="M13.26 3.6 5.05 12.29c-.31.32-.61.94-.67 1.38L4 16.71c-.24 1.73.99 2.92 2.71 2.62l3.02-.45c.44-.07 1.04-.38 1.34-.7l8.21-8.69c1.37-1.45 1.98-3.11-.14-5.11-2.11-1.99-3.75-.32-4.88.83Z" />
      <path d="M11.89 5.05c.45 2.87 2.78 5.09 5.67 5.43M3 22h18" />
    </>
  ),
  share: (
    <>
      <path d="M9 13.79l6.39 3.73M15.39 6.48 9 10.21" />
      <circle cx="6.5" cy="11.5" r="3" />
      <circle cx="17.5" cy="5.5" r="3" />
      <circle cx="17.5" cy="18.5" r="3" />
    </>
  ),
  shoppingBag: (
    <>
      <path d="M8.81 2h6.38a3 3 0 0 1 3 3v.23c0 3.79-.58 10.7-1.57 14.16A3.01 3.01 0 0 1 13.73 22H10.27a3.01 3.01 0 0 1-2.89-2.61C6.39 15.93 5.81 9.02 5.81 5.23V5a3 3 0 0 1 3-3ZM3.5 8h17M10 13h4" />
    </>
  ),
  filter: (
    <path d="M5.4 2.5h13.2c1.3 0 2.2 1.1 1.7 2.3l-4.7 8.1c-.2.4-.4 1-.4 1.5v4.8c0 .7-.4 1.3-1.1 1.6l-2.4 1c-1 .4-2-.3-2-1.3v-6.1c0-.5-.2-1.1-.4-1.5L4.9 4.8c-.5-1.2.4-2.3 1.7-2.3Z" />
  ),
  qrCode: (
    <>
      <path d="M2 9V6.5C2 4.01 4.01 2 6.5 2H9M15 2h2.5C19.99 2 22 4.01 22 6.5V9M22 15v2.5c0 2.49-2.01 4.5-4.5 4.5H15M9 22H6.5C4.01 22 2 19.99 2 17.5V15" />
      <rect x="6.5" y="6.5" width="4" height="4" rx="1" />
      <rect x="13.5" y="6.5" width="4" height="4" rx="1" />
      <rect x="6.5" y="13.5" width="4" height="4" rx="1" />
      <rect x="13.5" y="13.5" width="4" height="4" rx="1" />
    </>
  ),
  shieldCheck: (
    <>
      <path d="M10.49 2.23 5.5 4.11C4.35 4.54 3.41 5.9 3.41 7.12v6.61c0 1.25.82 2.76 1.83 3.36l4.49 2.68c1.25.75 3.29.75 4.54 0l4.49-2.68c1.01-.6 1.83-2.11 1.83-3.36V7.12c0-1.23-.94-2.59-2.09-3.02l-4.99-1.87c-.84-.31-2.2-.31-3.02 0ZM9.05 11.87l1.97 1.97 4.93-4.94" />
    </>
  ),
  info: (
    <>
      <path d="M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10ZM12 8v.01M12 12v4" />
    </>
  ),
  alertCircle: (
    <>
      <path d="M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10ZM12 8v5M11.99 16.5h.02" />
    </>
  ),
  calendar: (
    <>
      <path d="M8 2v3M16 2v3M3.5 9.09h17M21 8.5V17c0 3-1.5 5-5 5H8c-3.5 0-5-2-5-5V8.5c0-3 1.5-5 5-5h8c3.5 0 5 2 5 5ZM15.69 13.7h.01M15.69 16.7h.01M11.99 13.7h.02M11.99 16.7h.02M8.29 13.7h.02M8.29 16.7h.02" />
    </>
  ),
  user: (
    <>
      <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM20.59 22c0-3.87-3.85-7-8.59-7s-8.59 3.13-8.59 7" />
    </>
  ),
  copy: (
    <>
      <path d="M16 12.9V17c0 3-1.5 5-5 5H6c-3.5 0-5-2-5-5v-5c0-3 1.5-5 5-5h4.1M17 12.9c3 0 5-1.5 5-5V6c0-3-1.5-5-5-5h-5c-3.5 0-5 2-5 5v1.9" />
    </>
  ),
  chevronLeft: (
    <path d="m15 19.92-6.52-6.52c-.77-.77-.77-2.03 0-2.8L15 4.08" />
  ),
  chevronRight: (
    <path d="m8.91 19.92 6.52-6.52c.77-.77.77-2.03 0-2.8L8.91 4.08" />
  ),
  chevronDown: (
    <path d="m19.92 8.95-6.52 6.52c-.77.77-2.03.77-2.8 0L4.08 8.95" />
  ),
  arrowRight: (
    <>
      <path d="M14.43 5.93 20.5 12l-6.07 6.07M3.5 12h16.83" />
    </>
  ),
  utensils: (
    <path d="M19 3v8a3 3 0 0 1-3 3v7M16 3v8M13 3v8a3 3 0 0 0 3 3M8 3v18M5 3v5a3 3 0 0 0 3 3" />
  ),
  coffee: (
    <>
      <path d="M17 8h1a4 4 0 0 1 0 8h-1M3 8h14v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8ZM6 2v3M10 2v3M14 2v3" />
    </>
  ),
  briefcase: (
    <>
      <path d="M8 7V5.5C8 4.12 9.12 3 10.5 3h3C14.88 3 16 4.12 16 5.5V7M21 11v6c0 3-1.5 5-5 5H8c-3.5 0-5-2-5-5v-6c0-3 1.5-5 5-5h8c3.5 0 5 2 5 5ZM21 12.5l-3.66 2.44a4.98 4.98 0 0 1-5.55-.16L3 12.5M10.5 14.5h3" />
    </>
  ),
  layoutGrid: (
    <path d="M9.5 2H4.5A2.5 2.5 0 0 0 2 4.5v5A2.5 2.5 0 0 0 4.5 12h5A2.5 2.5 0 0 0 12 9.5v-5A2.5 2.5 0 0 0 9.5 2ZM19.5 2h-5A2.5 2.5 0 0 0 12 4.5v5a2.5 2.5 0 0 0 2.5 2.5h5a2.5 2.5 0 0 0 2.5-2.5v-5A2.5 2.5 0 0 0 19.5 2ZM9.5 12H4.5A2.5 2.5 0 0 0 2 14.5v5A2.5 2.5 0 0 0 4.5 22h5a2.5 2.5 0 0 0 2.5-2.5v-5A2.5 2.5 0 0 0 9.5 12ZM19.5 12h-5a2.5 2.5 0 0 0-2.5 2.5v5a2.5 2.5 0 0 0 2.5 2.5h5a2.5 2.5 0 0 0 2.5-2.5v-5a2.5 2.5 0 0 0-2.5-2.5Z" />
  ),
  truck: (
    <>
      <path d="M2 6h7M2 10h4M2 14h2" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="17.5" cy="18" r="2.5" />
      <path d="M9 18h6M4 15.5V5.5C4 4.12 5.12 3 6.5 3H14a3 3 0 0 1 3 3v9.5M17 8h2.38c.99 0 1.9.59 2.3 1.5l1.07 2.42c.16.36.25.75.25 1.15V15a2 2 0 0 1-2 2h-4" />
    </>
  ),
  link: (
    <>
      <path d="M14.99 15.66a4.73 4.73 0 0 1-3.35-1.39l-2.91-2.91a4.74 4.74 0 0 1 0-6.7 4.74 4.74 0 0 1 6.7 0l1.45 1.45" />
      <path d="M9.01 8.34a4.73 4.73 0 0 1 3.35 1.39l2.91 2.91a4.74 4.74 0 0 1 0 6.7 4.74 4.74 0 0 1-6.7 0l-1.45-1.45" />
    </>
  ),
  tag: (
    <>
      <path d="M12.63 2.53 4.15 11a3.02 3.02 0 0 0 0 4.27l4.58 4.58a3.02 3.02 0 0 0 4.27 0l8.47-8.47A3.01 3.01 0 0 0 22.36 9V4.64A2.64 2.64 0 0 0 19.72 2h-4.36c-.79 0-1.57.32-2.73.53Z" />
      <circle cx="17.5" cy="6.5" r="1" />
    </>
  ),
  trendingUp: (
    <>
      <path d="m15.5 6 6 .01v6" />
      <path d="M21.5 6 13.81 13.69c-.39.39-1.02.39-1.41 0L9.41 10.7c-.39-.39-1.02-.39-1.41 0L2 16.7" />
    </>
  ),
  wallet: (
    <>
      <path d="M19 8.5H5c-1.66 0-3 1.34-3 3v6c0 1.66 1.34 3 3 3h14c1.66 0 3-1.34 3-3v-6c0-1.66-1.34-3-3-3ZM5 8.5V6a3.5 3.5 0 0 1 7 0v2.5" />
      <circle cx="18.5" cy="14.5" r="1.5" />
    </>
  ),
  zap: (
    <path d="M12.5 2 4.2 12.8c-.37.49-.02 1.2.6 1.2h6.1l-1.9 8c-.2.83.78 1.42 1.39.84l9.41-8.84c.55-.52.2-1.46-.57-1.46h-6.3l3-10.54H12.5Z" />
  ),
  refresh: (
    <>
      <path d="M22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2c3.96 0 7.39 2.3 8.97 5.6" />
      <path d="M22 2v5.6h-5.6" />
    </>
  ),
};

/**
 * Micro-animations per icon category to make interactions fluid and lively
 */
const iconAnimations: Partial<Record<IconName, string>> = {
  sparkles: "transition-transform duration-200 ease-out group-hover:rotate-12 group-hover:scale-110 hover:rotate-12 hover:scale-110",
  zap: "transition-transform duration-200 ease-out group-hover:scale-115 group-hover:rotate-6 hover:scale-115 hover:rotate-6",
  shoppingBag: "transition-transform duration-200 ease-out group-hover:-rotate-6 group-hover:scale-110 hover:-rotate-6 hover:scale-110",
  store: "transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:scale-105 hover:-translate-y-0.5 hover:scale-105",
  arrowRight: "transition-transform duration-200 ease-out group-hover:translate-x-1 hover:translate-x-1",
  chevronRight: "transition-transform duration-200 ease-out group-hover:translate-x-1 hover:translate-x-1",
  back: "transition-transform duration-200 ease-out group-hover:-translate-x-1 hover:-translate-x-1",
  chevronLeft: "transition-transform duration-200 ease-out group-hover:-translate-x-1 hover:-translate-x-1",
  chevronDown: "transition-transform duration-200 ease-out group-hover:translate-y-0.5 hover:translate-y-0.5",
  refresh: "transition-transform duration-500 ease-in-out hover:rotate-180 group-hover:rotate-180",
  phone: "transition-transform duration-200 ease-out group-hover:rotate-[-8deg] group-hover:scale-110 hover:rotate-[-8deg] hover:scale-110",
  chat: "transition-transform duration-200 ease-out group-hover:scale-110 group-hover:rotate-[-4deg] hover:scale-110 hover:rotate-[-4deg]",
  edit: "transition-transform duration-200 ease-out group-hover:-rotate-12 group-hover:scale-110 hover:-rotate-12 hover:scale-110",
  trash: "transition-transform duration-200 ease-out group-hover:rotate-6 group-hover:scale-110 hover:rotate-6 hover:scale-110",
  search: "transition-transform duration-200 ease-out group-hover:scale-110 group-hover:rotate-6 hover:scale-110 hover:rotate-6",
  star: "transition-transform duration-200 ease-out group-hover:scale-120 group-hover:rotate-12 hover:scale-120 hover:rotate-12",
  mapPin: "transition-transform duration-200 ease-out group-hover:-translate-y-0.5 hover:-translate-y-0.5",
  copy: "transition-transform duration-150 ease-out active:scale-90 group-hover:scale-110 hover:scale-110",
  layoutGrid: "transition-transform duration-200 ease-out group-hover:scale-110 hover:scale-110",
  truck: "transition-transform duration-200 ease-out group-hover:translate-x-1 hover:translate-x-1",
  wallet: "transition-transform duration-200 ease-out group-hover:scale-108 hover:scale-108",
  tag: "transition-transform duration-200 ease-out group-hover:rotate-6 hover:rotate-6",
};

const defaultIconAnim = "transition-transform duration-200 ease-out group-hover:scale-108 hover:scale-108 active:scale-95";

export function Icon({
  name,
  size = 20,
  animate = true,
  className = "",
  ...props
}: SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number;
  animate?: boolean;
  className?: string;
}) {
  const animClass = animate ? (iconAnimations[name] || defaultIconAnim) : "";

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      className={`shrink-0 will-change-transform ${animClass} ${className}`.trim()}
      aria-hidden="true"
      {...props}
    >
      {paths[name] || paths.info}
    </svg>
  );
}

/**
 * Modern Delivery / Agent Partner Badges with smooth micro-animation
 */
export function FoodAgentIcon({
  agent,
  size = 18,
  className = "",
}: {
  agent: "whatsapp" | "gofood" | "shopeefood" | "grabfood";
  size?: number;
  className?: string;
}) {
  const anim = "transition-transform duration-200 ease-out hover:scale-110 group-hover:scale-110 active:scale-95 will-change-transform shrink-0";

  if (agent === "whatsapp") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className={`${anim} ${className}`.trim()}
      >
        <rect width="24" height="24" rx="6" fill="#059669" />
        <path
          d="M19 11.5a7 7 0 0 1-10.4 6.1L5 19l1.4-3.5A7 7 0 1 1 19 11.5Z"
          stroke="#fff"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9.5 10c.3 1.5 1.7 2.9 3.2 3.2l1.1-.8c.3-.2.7-.1.9.1l.8 1.1c.2.3.1.8-.2 1-.9.6-2.2.5-3.5-.2a7.6 7.6 0 0 1-3.1-3.1c-.7-1.3-.8-2.6-.2-3.5.2-.3.7-.4 1-.2l1.1.8c.2.2.3.6.1.9l-.8 1.1Z"
          fill="#fff"
        />
      </svg>
    );
  }

  if (agent === "shopeefood") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className={`${anim} ${className}`.trim()}
      >
        <rect width="24" height="24" rx="6" fill="#EE4D2D" />
        <path
          d="M7 9.5h10l-.8 8.2a1.5 1.5 0 0 1-1.5 1.3H9.3a1.5 1.5 0 0 1-1.5-1.3L7 9.5Z"
          stroke="#fff"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path d="M9.5 9.5V8a2.5 2.5 0 0 1 5 0v1.5" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
        <path
          d="M10.5 13.5c.4-.5 1.2-.7 2-.4.8.3 1 1.1.3 1.6-.7.5-1.8.6-2.3 1.2"
          stroke="#fff"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (agent === "gofood") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className={`${anim} ${className}`.trim()}
      >
        <rect width="24" height="24" rx="6" fill="#00AA13" />
        <path
          d="M8.5 7v5a2 2 0 0 0 4 0V7M10.5 7v10M15.5 7v10M15.5 7c1.5 0 2.5 1.2 2.5 3v2h-2.5"
          stroke="#fff"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // grabfood
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`${anim} ${className}`.trim()}
    >
      <rect width="24" height="24" rx="6" fill="#00B14F" />
      <path
        d="M16.5 9.5A5 5 0 1 0 17 13h-4.5"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
