# SPEC.md — Frontend Overhaul Specification (Luvio)

> **Status**: `FINALIZED`

## Vision
Transform **Luvio** into a world-class local food & marketplace directory that seamlessly combines **natural freshness** and **clean-tech precision** (Natural-Tech Aesthetic). The platform is optimized for users of all ages with zero generic AI slop, WCAG AAA contrast, ergonomic touch targets (≥ 44×44px), authentic Iconsax linear vector iconography, and fluid 60 FPS micro-interactions with zero JavaScript runtime overhead.

## Goals
1. **Unified Design System**: Implement the complete Natural-Tech design tokens (Botanical Emerald `#059669`, Warm Sun Amber `#F59E0B`, Obsidian Ink `#0F172A`, Slate Muted, Natural Canvas `#F8FAFC`) across all public and portal views.
2. **Mobile-First Ergonomics**: Align the mobile bottom dock bar strictly to `fitur.md` with 3 items: **Beranda**, **Pencarian** (elevated prominent center button), and **Akun**, alongside mobile-first card layouts.
3. **Streamlined Store & Menu Experience**: Seamless store detail page with dynamic delivery channels (shown only when configured by store), high-contrast quantity pickers `[-] 1 [+]`, and floating pop-up cart with itemized breakdown and WhatsApp checkout.
4. **Portal Clarity (Strict 3-Menu Rule)**: Keep Merchant Portal (`/portal/toko`) and Admin Portal (`/portal/admin`) clean, focused, and limited to exactly 3 core functional menus as specified in `fitur.md`.
5. **Zero Native Dialogs**: Replace all native browser popups (`alert`, `confirm`, `prompt`) with custom in-app accessible modals and toasts (`useDialog`, `useToast`).

## Non-Goals (Out of Scope)
- Modifying backend PostgreSQL schema or introducing external payment gateways (platform operates strictly via WhatsApp checkout and direct merchant delivery with zero transaction fee).
- Adding buyer account registration requirements for catalog browsing.
- Heavy animation libraries (e.g. Framer Motion, Lottie); all micro-interactions must remain pure CSS GPU-accelerated.

## Users
- **End Consumers (All Ages)**: Looking for nearby food and local stores, checking menus and estimated distance, ordering directly to WhatsApp without commission or app download.
- **Store Owners (Merchants)**: Local UMKM merchants updating their store information, menu items, delivery channels, and tracking daily visits and manual turnover.
- **Platform Admin**: Managing store listings, generating static/dynamic QR codes, and processing free affiliate registration appointments.

## Constraints
- Next.js 16 (App Router) + Tailwind CSS v4 + TypeScript.
- 100% Pure SVG Icons (Iconsax Linear, stroke-width 1.6, round joins). Zero emojis in UI.
- Strict compliance with `fitur.md`, `desain.md`, and `.agents/rules/no-browser-dialogs.md`.
- Both live Supabase and offline/demo datasets must continue to work seamlessly.

## Success Criteria
- [ ] Mobile bottom dock bar matches `fitur.md` (Beranda, elevated center Pencarian, Akun).
- [ ] Store card displays real-time Haversine distance and only active delivery channels.
- [ ] Store menu card provides accessible `[-] 1 [+]` counter and floating pop-up cart modal.
- [ ] Header displays distinct "MASUK" (emerald pill) and "DAFTAR" (amber button) with Iconsax micro-animations.
- [ ] Zero native browser dialogs in store and admin portals.
- [ ] `npm run typecheck`, `npm run test:db`, and `npm run build` pass with zero errors.

