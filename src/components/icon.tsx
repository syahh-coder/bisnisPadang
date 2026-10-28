import type { SVGProps } from "react";

export type IconName = "home" | "search" | "account" | "store" | "back" | "phone" | "chat";

const paths: Record<IconName, React.ReactNode> = {
  back: <><path d="m10 5-7 7 7 7M3 12h18" /></>,
  phone: <path d="M21 16.5V20a1 1 0 0 1-1.1 1C10.4 20.4 3.6 13.6 3 4.1A1 1 0 0 1 4 3h3.5l2 5-2 2a16 16 0 0 0 6.5 6.5l2-2 5 2Z" />,
  chat: <path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 11.5Z" />,
  home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h5v-6h4v6h5V10" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  account: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" /></>,
  store: <><path d="M3 10h18l-2-6H5l-2 6Z" /><path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M5 13v7h14v-7M10 20v-5h4v5" /></>,
};

export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24" aria-hidden="true" {...props}>
      {paths[name]}
    </svg>
  );
}
