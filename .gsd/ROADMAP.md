# ROADMAP.md — Frontend Overhaul Execution Roadmap

> **Status**: `ACTIVE`
> **Milestone**: Full Frontend Overhaul per GSD & `desain.md` / `fitur.md`

---

## Phase Overview

| Phase | Focus | Status | Wave Assignment |
|-------|-------|--------|-----------------|
| 1 | Navigation & Mobile Dock Bar Alignment | Ready | Wave 1 |
| 2 | Discovery & Catalog Views (Home, Search, Categories) | Ready | Wave 1 |
| 3 | Store Detail, Menu Cards & Floating Cart Polish | Ready | Wave 2 (depends on 1) |
| 4 | Merchant & Admin Portals 3-Menu Enforcement | Ready | Wave 2 (depends on 1) |
| 5 | Empirical Verification & Production Build | Ready | Wave 3 (depends on 2, 3, 4) |

---

## Phase 1: Navigation & Mobile Dock Bar Alignment
**Goal**: Bring the mobile navigation dock bar into 100% compliance with `fitur.md`:
- Bottom bar 3 items: **Beranda**, **Pencarian** (elevated prominent center circular button), and **Akun**.
- Desktop header maintains: **Beranda**, **Pencarian**, **Kategori**, plus distinct **MASUK** and **DAFTAR** action buttons.
- All icons using authentic Iconsax Linear with spring micro-interactions.

## Phase 2: Discovery & Catalog Views Overhaul
**Goal**: Elevate Homepage, Search, and Category pages to the full Natural-Tech aesthetic:
- Remove any remnant AI slop or awkward banners.
- Clean category grid / chip selector with Iconsax icons and store counts.
- Store card: 16:10 image ratio, subtle hover zoom, verified rating with Warm Sun Amber, dynamic distance calculation (`± x.x km`), and dynamic delivery pills (WA Kurir, GoFood, ShopeeFood, GrabFood) shown only when configured.

## Phase 3: Store Detail, Menu Cards & Floating Pop-Up Cart
**Goal**: Perfect the store menu browsing and order-building experience:
- Store hero with photo, address, Google Maps link, distance indicator.
- Menu card: high-contrast counter controls `[-] 1 [+]` (min 44px tap target), instant note input.
- Floating cart pop-up button: bottom-right circular badge displaying item count & total price, expanding into itemized checkout sheet with WhatsApp order generator.

## Phase 4: Merchant & Admin Portals UX
**Goal**: Enforce the strict 3-menu architecture per `fitur.md`:
- Merchant Portal (`/portal/toko`): Visitors today & acquisition sources, manual turnover/sales entry, store/menu manager.
- Admin Portal (`/portal/admin`): QR Generator (static + dynamic up to 15 days), Store List, Store Management (free affiliate onboarding).
- Zero native browser dialogs: strictly custom in-app accessible modals & toasts.

## Phase 5: Empirical Verification & Production Build
**Goal**: Prove all must-haves with verified command outputs:
- `npm run typecheck` zero errors.
- `npm run test:db` 27/27 tests pass.
- `npm run build` compiles all 19 static and dynamic routes.
- HTTP 200 checks on `/`, `/pencarian`, `/kategori`, `/toko/[slug]`, `/akun`, `/portal/admin`, `/portal/toko`.
