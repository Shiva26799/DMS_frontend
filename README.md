# LOVOL Distribution Management System (DMS)

A comprehensive, enterprise-grade Distribution Management System built with React, TypeScript, and Tailwind CSS for LOVOL, a harvester manufacturing company.

## 🚀 Features

### Core Modules

1. **Executive Dashboard** - KPI cards, sales trends, inventory status, and dealer performance metrics
2. **Lead Management** - Kanban/Table views with full lead lifecycle tracking
3. **Dealer Management** - Dealer profiles, credit monitoring, and performance tracking
4. **Product & Inventory Management** - Product catalog and multi-location inventory tracking
5. **Order Management** - 9-stage workflow tracking with payment and delivery status
6. **Warranty Management** - Claim validation, approval workflow, and warranty tracking
7. **Maintenance Management** - Preventive maintenance scheduling and service tracking
8. **Reports & Analytics** - Role-based dashboards and data export functionality

### Key Features

- ✅ Enterprise-grade UI following Salesforce/SAP/Zoho CRM design patterns
- ✅ Fixed left sidebar navigation with expandable submenus
- ✅ Top header with global search and notifications
- ✅ Card-based layouts with professional styling
- ✅ Advanced data tables with filtering and sorting
- ✅ Status badges and progress indicators
- ✅ Role-based access control ready
- ✅ Fully responsive design
- ✅ Comprehensive mock data for all modules

## 🛠️ Tech Stack

- **Framework:** React 18.3.1
- **Language:** TypeScript
- **Routing:** React Router 7
- **Styling:** Tailwind CSS 4
- **UI Components:** Radix UI, shadcn/ui
- **Charts:** Recharts
- **Icons:** Lucide React
- **Build Tool:** Vite 6
- **Form Handling:** React Hook Form
- **Drag & Drop:** React DnD
- **Animations:** Motion (Framer Motion)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher recommended)
- **pnpm** (v8 or higher)

If you don't have pnpm installed, you can install it globally:

```bash
npm install -g pnpm
```

## 🚀 Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

This will install all required dependencies from the package.json file.

### 2. Run Development Server

```bash
pnpm run dev
```

The application will start on `http://localhost:5173` (or another port if 5173 is busy).

### 3. Build for Production

```bash
pnpm run build
```

This will create an optimized production build in the `dist` folder.

### 4. Preview Production Build

```bash
pnpm run preview
```

This will serve the production build locally for testing.

## 📁 Project Structure

```
lovol-dms/
├── src/
│   ├── app/
│   │   ├── components/         # Reusable components
│   │   │   ├── Header.tsx     # Top navigation header
│   │   │   ├── Sidebar.tsx    # Left sidebar navigation
│   │   │   ├── Layout.tsx     # Main layout wrapper
│   │   │   ├── KPICard.tsx    # KPI metric cards
│   │   │   ├── StatusBadge.tsx # Status indicators
│   │   │   ├── figma/         # Figma integration components
│   │   │   └── ui/            # shadcn/ui components
│   │   ├── pages/             # Page components
│   │   │   ├── ExecutiveDashboard.tsx
│   │   │   ├── LeadManagement.tsx
│   │   │   ├── LeadDetail.tsx
│   │   │   ├── DealerManagement.tsx
│   │   │   ├── DealerDetail.tsx
│   │   │   ├── ProductCatalogue.tsx
│   │   │   ├── ProductDetail.tsx
│   │   │   ├── InventoryManagement.tsx
│   │   │   ├── OrderManagement.tsx
│   │   │   ├── OrderDetail.tsx
│   │   │   ├── WarrantyManagement.tsx
│   │   │   ├── WarrantyDetail.tsx
│   │   │   ├── MaintenanceManagement.tsx
│   │   │   └── Reports.tsx
│   │   ├── data/
│   │   │   └── mockData.ts    # All mock data and types
│   │   ├── App.tsx            # Root app component
│   │   └── routes.tsx         # React Router configuration
│   ├── styles/
│   │   ├── index.css          # Main CSS entry point
│   │   ├── tailwind.css       # Tailwind imports
│   │   ├── theme.css          # Theme variables
│   │   └── fonts.css          # Font imports
│   └── main.tsx               # App entry point
├── index.html                  # HTML entry point
├── package.json
├── vite.config.ts
└── README.md
```

## 🎨 Design System

### Color Palette

- **Primary:** Deep Blue (`#1E40AF`, `#2563EB`) - Primary actions, links
- **Success:** Green (`#10B981`, `#059669`) - Success states, completed items
- **Warning:** Orange (`#F59E0B`, `#D97706`) - Warnings, pending items
- **Danger:** Red (`#EF4444`, `#DC2626`) - Errors, critical alerts
- **Gray Scale:** Professional gray tones for backgrounds and text

### Components

- **KPI Cards:** Metric display with icons, values, and trends
- **Status Badges:** Color-coded status indicators
- **Data Tables:** Advanced tables with sorting and filtering
- **Progress Indicators:** Visual progress tracking
- **Cards:** Content containers with consistent padding and shadows

## 🗺️ Navigation Structure

```
/ (Executive Dashboard)
├── /leads (Lead Management)
│   └── /leads/:id (Lead Detail)
├── /dealers (Dealer Management)
│   └── /dealers/:id (Dealer Detail)
├── Products & Inventory
│   ├── /products (Product Catalogue)
│   │   └── /products/:id (Product Detail)
│   └── /inventory (Inventory Management)
├── /orders (Order Management)
│   └── /orders/:id (Order Detail)
├── /warranty (Warranty Management)
│   └── /warranty/:id (Warranty Detail)
├── /maintenance (Maintenance Management)
└── /reports (Reports & Analytics)
```

## 📊 Mock Data

The system includes comprehensive mock data for:

- **Leads:** 5 sample leads with various statuses
- **Dealers:** 5 dealers across different regions
- **Products:** 3 harvester models + 2 spare parts
- **Inventory:** 7 inventory items across multiple locations
- **Orders:** 5 orders with different stages and statuses
- **Warranty Claims:** 5 warranty claims with various statuses
- **Maintenance Records:** Multiple service records with schedules

All mock data is defined in `/src/app/data/mockData.ts` with TypeScript interfaces.

## 🔒 Role-Based Access Control (RBAC)

The system is designed to support the following user roles:

- **Super Admin:** Full system access
- **Regional Manager:** Regional sales and dealer management
- **Dealer:** Order placement and warranty claims
- **Accounts Team:** Financial and credit management
- **Service Team:** Warranty and maintenance management
- **Warehouse Manager:** Inventory and logistics management

*Note: RBAC logic needs to be implemented based on authentication system.*

## 🚀 Key Features by Module

### Executive Dashboard
- Real-time KPI metrics (Orders, Approvals, Inventory Value, Performance)
- Sales trends line chart (7 months)
- Inventory status bar chart
- Dealer performance comparison
- Recent orders table
- Pending warranty claims
- Low stock alerts

### Lead Management
- Switch between Table and Kanban views
- Filter by status and region
- Search by customer name or product
- Drag-and-drop in Kanban view (ready for implementation)
- Lead detail page with full information
- Status progression tracking

### Dealer Management
- Comprehensive dealer directory
- Credit limit and outstanding monitoring
- Performance scoring
- Activity history
- Dealer detail pages
- Quick actions for contact and orders

### Product & Inventory
- Product catalog with specifications
- Multi-location inventory tracking
- Stock level monitoring (Normal, Low, Critical, Out of Stock)
- Reorder level alerts
- Product detail pages with full specs

### Order Management
- 9-stage workflow tracking:
  1. Order Approval
  2. Payment Verification
  3. Inventory Allocation
  4. Production Planning
  5. Manufacturing Status
  6. Quality Approval
  7. Delivery Tracking
  8. Installation Status
  9. Order Closure
- Payment status tracking
- Order detail pages with progress indicators

### Warranty Management
- Claim submission and tracking
- Warranty validation rules
- 7-stage approval workflow
- Dealer-wise claim history
- Issue resolution tracking

### Maintenance Management
- Preventive maintenance scheduling
- Service type tracking (3-Month, 6-Month, 500-Hour, 1000-Hour)
- Overdue service alerts
- Service history
- Bulk scheduling capabilities

### Reports & Analytics
- Sales performance reports
- Dealer performance analytics
- Inventory reports
- Order fulfillment metrics
- Warranty claim analysis
- Export to Excel/PDF (ready for implementation)

## 🔧 Customization

### Adding New Pages

1. Create a new page component in `/src/app/pages/`
2. Add route configuration in `/src/app/routes.tsx`
3. Update sidebar navigation in `/src/app/components/Sidebar.tsx`

### Modifying Mock Data

All mock data is centralized in `/src/app/data/mockData.ts`. Update this file to:
- Add new data entries
- Modify data structures
- Update TypeScript interfaces

### Styling Customization

- **Theme Colors:** Edit `/src/styles/theme.css`
- **Tailwind Config:** Tailwind v4 uses CSS-based configuration
- **Component Styles:** Components use Tailwind utility classes

## 🔌 API Integration

To integrate with a real backend API:

1. Replace mock data imports with API calls
2. Implement data fetching hooks (e.g., React Query or SWR)
3. Add loading states and error handling
4. Implement authentication and authorization
5. Add form submission endpoints

Example API integration pattern:

```typescript
// Before (mock data)
import { mockLeads } from "../data/mockData";

// After (API integration)
const { data: leads, isLoading } = useQuery('leads', () => 
  fetch('/api/leads').then(res => res.json())
);
```

## 📱 Responsive Design

The system is fully responsive:
- **Desktop:** Full sidebar with all features visible
- **Tablet:** Collapsible sidebar, optimized layouts
- **Mobile:** Hamburger menu, stacked components

## 🐛 Troubleshooting

### Port Already in Use

If port 5173 is busy, Vite will automatically try the next available port. You can also specify a custom port:

```bash
pnpm run dev -- --port 3000
```

### Dependencies Not Installing

Try clearing the pnpm cache:

```bash
pnpm store prune
pnpm install
```

### Build Errors

Ensure you're using compatible Node.js version:

```bash
node --version  # Should be v18+
pnpm --version  # Should be v8+
```

## 📝 Development Guidelines

1. **TypeScript:** Use proper typing for all components and data
2. **Component Structure:** Follow the existing component pattern
3. **Styling:** Use Tailwind utility classes consistently
4. **State Management:** Use React hooks for local state
5. **Navigation:** Use React Router's `Link` component for internal navigation
6. **Mock Data:** Keep mock data realistic and comprehensive

## 🤝 Contributing

When making changes:

1. Follow the existing code structure
2. Maintain TypeScript type safety
3. Test responsive behavior
4. Update mock data if needed
5. Document new features in README

## 📄 License

This project is proprietary and confidential.

## 🎯 Next Steps

### Recommended Enhancements

1. **Authentication:** Implement user login and session management
2. **API Integration:** Connect to backend services
3. **RBAC Implementation:** Add role-based permission checks
4. **Real-time Updates:** Add WebSocket for live data
5. **Export Functionality:** Implement Excel/PDF export
6. **Advanced Filtering:** Add date range and multi-select filters
7. **Notifications:** Real-time notification system
8. **Audit Logs:** Track user actions and changes
9. **Advanced Search:** Global search with autocomplete
10. **Dashboard Customization:** User-specific dashboard layouts

---

**Built with ❤️ for LOVOL**

For questions or support, contact the development team.
