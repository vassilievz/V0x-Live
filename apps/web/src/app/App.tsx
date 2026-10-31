import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { AppRouter } from "./router";
import { SessionBootstrap } from "@/components/SessionBootstrap";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <SessionBootstrap />
        <AppRouter />
      </BrowserRouter>
      </MotionConfig>
    </QueryClientProvider>
  );
}
