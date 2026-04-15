# 📁 LOVOL DMS - Complete File Structure

```
lovol-dms/
│
├── 📄 index.html                    # HTML entry point
├── 📄 package.json                  # Dependencies & scripts
├── 📄 vite.config.ts               # Vite build configuration
├── 📄 postcss.config.mjs           # PostCSS configuration
│
├── 📚 Documentation/
│   ├── START-HERE.md               # ⭐ Start here! Quick reference
│   ├── QUICKSTART.md               # 3-step quick start guide
│   ├── README.md                   # Complete documentation (500+ lines)
│   ├── SETUP-CHECKLIST.md          # Setup verification & troubleshooting
│   ├── SYSTEM-OVERVIEW.md          # Complete file inventory
│   ├── FILE-STRUCTURE.md           # This file
│   ├── SETUP.sh                    # Auto-setup script (Mac/Linux)
│   ├── SETUP.bat                   # Auto-setup script (Windows)
│   ├── ATTRIBUTIONS.md             # Third-party attributions
│   └── guidelines/
│       └── Guidelines.md           # Project guidelines
│
├── 🎨 src/
│   ├── 📄 main.tsx                 # React app entry point
│   │
│   ├── 🎯 app/
│   │   ├── 📄 App.tsx              # Root component
│   │   ├── 📄 routes.tsx           # Router configuration (14 routes)
│   │   │
│   │   ├── 🎨 components/
│   │   │   ├── Layout.tsx          # Main layout wrapper
│   │   │   ├── Sidebar.tsx         # Left navigation sidebar
│   │   │   ├── Header.tsx          # Top header with search
│   │   │   ├── KPICard.tsx         # Metric display cards
│   │   │   ├── StatusBadge.tsx     # Status indicators
│   │   │   │
│   │   │   ├── figma/
│   │   │   │   └── ImageWithFallback.tsx
│   │   │   │
│   │   │   └── ui/                 # 50+ shadcn/ui components
│   │   │       ├── accordion.tsx
│   │   │       ├── alert-dialog.tsx
│   │   │       ├── alert.tsx
│   │   │       ├── aspect-ratio.tsx
│   │   │       ├── avatar.tsx
│   │   │       ├── badge.tsx
│   │   │       ├── breadcrumb.tsx
│   │   │       ├── button.tsx
│   │   │       ├── calendar.tsx
│   │   │       ├── card.tsx
│   │   │       ├── carousel.tsx
│   │   │       ├── chart.tsx
│   │   │       ├── checkbox.tsx
│   │   │       ├── collapsible.tsx
│   │   │       ├── command.tsx
│   │   │       ├── context-menu.tsx
│   │   │       ├── dialog.tsx
│   │   │       ├── drawer.tsx
│   │   │       ├── dropdown-menu.tsx
│   │   │       ├── form.tsx
│   │   │       ├── hover-card.tsx
│   │   │       ├── input-otp.tsx
│   │   │       ├── input.tsx
│   │   │       ├── label.tsx
│   │   │       ├── menubar.tsx
│   │   │       ├── navigation-menu.tsx
│   │   │       ├── pagination.tsx
│   │   │       ├── popover.tsx
│   │   │       ├── progress.tsx
│   │   │       ├── radio-group.tsx
│   │   │       ├── resizable.tsx
│   │   │       ├── scroll-area.tsx
│   │   │       ├── select.tsx
│   │   │       ├── separator.tsx
│   │   │       ├── sheet.tsx
│   │   │       ├── sidebar.tsx
│   │   │       ├── skeleton.tsx
│   │   │       ├── slider.tsx
│   │   │       ├── sonner.tsx
│   │   │       ├── switch.tsx
│   │   │       ├── table.tsx
│   │   │       ├── tabs.tsx
│   │   │       ├── textarea.tsx
│   │   │       ├── toggle-group.tsx
│   │   │       ├── toggle.tsx
│   │   │       ├── tooltip.tsx
│   │   │       ├── use-mobile.ts
│   │   │       └── utils.ts        # Utility functions (cn)
│   │   │
│   │   ├── 📄 pages/               # 14 Page Components
│   │   │   ├── ExecutiveDashboard.tsx    # Main dashboard
│   │   │   ├── LeadManagement.tsx        # Lead list
│   │   │   ├── LeadDetail.tsx            # Lead details
│   │   │   ├── DealerManagement.tsx      # Dealer directory
│   │   │   ├── DealerDetail.tsx          # Dealer profile
│   │   │   ├── ProductCatalogue.tsx      # Product catalog
│   │   │   ├── ProductDetail.tsx         # Product details
│   │   │   ├── InventoryManagement.tsx   # Inventory tracking
│   │   │   ├── OrderManagement.tsx       # Order list
│   │   │   ├── OrderDetail.tsx           # Order details
│   │   │   ├── WarrantyManagement.tsx    # Warranty claims
│   │   │   ├── WarrantyDetail.tsx        # Claim details
│   │   │   ├── MaintenanceManagement.tsx # Maintenance schedules
│   │   │   └── Reports.tsx               # Reports & analytics
│   │   │
│   │   └── 💾 data/
│   │       └── mockData.ts         # All mock data + TypeScript interfaces
│   │
│   └── 🎨 styles/
│       ├── index.css               # Main CSS entry
│       ├── tailwind.css            # Tailwind v4 config
│       ├── theme.css               # Theme variables
│       └── fonts.css               # Font imports
│
└── 📦 Dependencies (installed in node_modules/)
    ├── React 18.3.1
    ├── React Router 7.13.0
    ├── Tailwind CSS 4.1.12
    ├── Vite 6.3.5
    ├── TypeScript
    ├── Recharts 2.15.2
    ├── Lucide React 0.487.0
    ├── Motion 12.23.24
    ├── Radix UI (15+ packages)
    └── 45+ more packages...
```

## 📊 Statistics

### File Counts
- **Total Files:** 90+ files
- **Page Components:** 14
- **UI Components:** 50+
- **Layout Components:** 3
- **Shared Components:** 2
- **Documentation Files:** 8
- **Configuration Files:** 3

### Code Statistics
- **Lines of Code:** ~5,000+
- **TypeScript Interfaces:** 7
- **Mock Data Records:** 30+
- **Routes Configured:** 14
- **Dependencies:** 63 production + 3 dev

### Documentation
- **Total Doc Lines:** ~2,000+
- **README:** 500+ lines
- **Quick Start:** Concise 3-step guide
- **Setup Checklist:** Comprehensive troubleshooting
- **System Overview:** Complete inventory

## 🎯 Key File Purposes

### Entry Points
- **`index.html`** → HTML shell, loads main.tsx
- **`src/main.tsx`** → React initialization, renders App
- **`src/app/App.tsx`** → Root component, provides RouterProvider
- **`src/app/routes.tsx`** → Route definitions for all 14 pages

### Core Layout
- **`Layout.tsx`** → Main wrapper (Sidebar + Header + Outlet)
- **`Sidebar.tsx`** → Left navigation with icons
- **`Header.tsx`** → Top bar with search and notifications

### Reusable Components
- **`KPICard.tsx`** → Metric cards with icons and trends
- **`StatusBadge.tsx`** → Color-coded status badges
- **`ui/*.tsx`** → 50+ shadcn/ui components

### Data Layer
- **`mockData.ts`** → All interfaces and mock data
  - Lead[] - Customer leads
  - Dealer[] - Dealer network
  - Product[] - Product catalog
  - InventoryItem[] - Stock tracking
  - Order[] - Order lifecycle
  - WarrantyClaim[] - Warranty claims
  - MaintenanceRecord[] - Service schedules

### Styling
- **`index.css`** → Imports all CSS
- **`tailwind.css`** → Tailwind v4 configuration
- **`theme.css`** → CSS variables and design tokens
- **`fonts.css`** → Custom font imports

### Configuration
- **`package.json`** → Scripts and dependencies
- **`vite.config.ts`** → Build configuration
- **`postcss.config.mjs`** → CSS processing

## 🔍 How to Find Things

### Looking for...

**A specific page?**
→ Check `/src/app/pages/[ModuleName].tsx`

**A UI component?**
→ Check `/src/app/components/ui/[component].tsx`

**Mock data?**
→ Check `/src/app/data/mockData.ts`

**Routes?**
→ Check `/src/app/routes.tsx`

**Navigation?**
→ Check `/src/app/components/Sidebar.tsx`

**Styles?**
→ Check `/src/styles/theme.css` for variables
→ Or inline Tailwind classes in components

**Documentation?**
→ Check root directory .md files

**Setup scripts?**
→ Check `SETUP.sh` (Mac/Linux) or `SETUP.bat` (Windows)

## 📝 Import Paths

### Common Import Patterns

```typescript
// Pages
import { ExecutiveDashboard } from "./pages/ExecutiveDashboard";

// Components
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { KPICard } from "../components/KPICard";
import { StatusBadge } from "../components/StatusBadge";

// Data
import { mockLeads, mockDealers, mockOrders } from "../data/mockData";
import type { Lead, Dealer, Order } from "../data/mockData";

// React Router
import { Link, useParams, useNavigate } from "react-router";

// Icons
import { Plus, Search, Filter } from "lucide-react";

// Utils
import { cn } from "../components/ui/utils";
```

## 🎨 Component Organization

### Atomic Design Pattern

**Atoms** (Basic building blocks)
→ `/src/app/components/ui/` - buttons, inputs, badges

**Molecules** (Simple combinations)
→ `KPICard.tsx`, `StatusBadge.tsx`

**Organisms** (Complex sections)
→ `Header.tsx`, `Sidebar.tsx`

**Templates** (Page layouts)
→ `Layout.tsx`

**Pages** (Full screens)
→ `/src/app/pages/` - All 14 pages

## 🚀 Getting Started Guide Reference

1. **First Time?** → Read `START-HERE.md`
2. **Quick Setup?** → Follow `QUICKSTART.md`
3. **Need Details?** → Check `README.md`
4. **Having Issues?** → Use `SETUP-CHECKLIST.md`
5. **Want Overview?** → See `SYSTEM-OVERVIEW.md`
6. **File Structure?** → You're reading it! `FILE-STRUCTURE.md`

## ✅ Verification Checklist

Use this to verify all files exist:

- [ ] `/index.html` exists
- [ ] `/src/main.tsx` exists
- [ ] `/src/app/App.tsx` exists
- [ ] `/src/app/routes.tsx` exists
- [ ] `/src/app/components/Layout.tsx` exists
- [ ] `/src/app/components/Sidebar.tsx` exists
- [ ] `/src/app/components/Header.tsx` exists
- [ ] `/src/app/data/mockData.ts` exists
- [ ] All 14 page files in `/src/app/pages/` exist
- [ ] `/package.json` has "dev" script
- [ ] Documentation files exist

**If all checked ✅ → You're ready to run!**

## 📞 Quick Commands

```bash
# See all files
ls -la

# Count TypeScript files
find src -name "*.tsx" -o -name "*.ts" | wc -l

# View project structure
tree -L 3 -I 'node_modules'

# Search for a component
grep -r "export function LeadManagement" src/

# Start development
pnpm run dev
```

---

**Last Updated:** February 27, 2026  
**Version:** 0.0.1  
**Status:** Production-Ready Frontend
