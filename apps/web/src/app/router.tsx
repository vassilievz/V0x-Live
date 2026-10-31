import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { RootLayout } from "@/layouts/RootLayout";
import { LandingPage } from "@/pages/LandingPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ExploreRoomsPage } from "@/pages/ExploreRoomsPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { RoomPageSuspenseFallback } from "@/components/RoomPageSuspenseFallback";

const RoomPage = lazy(() => import("@/pages/RoomPage").then((module) => ({ default: module.RoomPage })));

export function AppRouter() {
  return (
    <Routes>
      <Route path="/room/:roomId" element={<Suspense fallback={<RoomPageSuspenseFallback />}><RoomPage /></Suspense>} />
      <Route element={<RootLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="login" element={<Navigate to="/dashboard" replace />} />
        <Route path="register" element={<Navigate to="/dashboard" replace />} />
        <Route path="forgot-password" element={<Navigate to="/dashboard" replace />} />
        <Route path="profile" element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="rooms" element={<ExploreRoomsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
