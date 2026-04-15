import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import { ExecutiveDashboard } from "./pages/ExecutiveDashboard";
import { LeadManagement } from "./pages/LeadManagement";
import { LeadDetail } from "./pages/LeadDetail";
import { CustomerManagement } from "./pages/CustomerManagement";
import { DealerManagement } from "./pages/DealerManagement";
import { DealerDetail } from "./pages/DealerDetail";
import { ProductCatalogue } from "./pages/ProductCatalogue";
import { ProductDetail } from "./pages/ProductDetail";
import { InventoryManagement } from "./pages/InventoryManagement";
import { OrderManagement } from "./pages/OrderManagement";
import { OrderDetail } from "./pages/OrderDetail";
import { WarrantyManagement } from "./pages/WarrantyManagement";
import { WarrantyDetail } from "./pages/WarrantyDetail";
import { MaintenanceManagement } from "./pages/MaintenanceManagement";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";
import SuperAdminGuard from "./routes/guards/SuperAdminGuard";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    Component: ProtectedRoute,
    children: [
      {
        path: "/",
        Component: Layout,
        children: [
          { index: true, Component: ExecutiveDashboard },
          { path: "leads", Component: LeadManagement },
          { path: "leads/:id", Component: LeadDetail },
          { path: "customers", Component: CustomerManagement },
          { path: "customers/:id", Component: LeadDetail },
          { path: "dealers", Component: DealerManagement },
          { path: "dealers/:id", Component: DealerDetail },
          { path: "products", Component: ProductCatalogue },
          { path: "products/:id", Component: ProductDetail },
          { path: "inventory", Component: InventoryManagement },
          { path: "orders", Component: OrderManagement },
          { path: "orders/:id", Component: OrderDetail },
          { path: "warranty", Component: WarrantyManagement },
          { path: "warranty/:id", Component: WarrantyDetail },
          { path: "maintenance", Component: MaintenanceManagement },
          { path: "reports", Component: Reports },
          { 
            path: "settings", 
            element: <SuperAdminGuard><Settings /></SuperAdminGuard> 
          },
        ],
      },
    ],
  },
]);