import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "./context/AuthContext";
import { DealerProvider } from "./context/DealerContext";
import { OrderProvider } from "./context/OrderContext";
import { WarrantyProvider } from "./context/WarrantyContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WarrantyProvider>
          <DealerProvider>
            <OrderProvider>
              <RouterProvider router={router} />
            </OrderProvider>
          </DealerProvider>
        </WarrantyProvider>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
