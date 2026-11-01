import { BrowserRouter, Routes, Route } from "react-router-dom";

import HomePage from "./pages/Public/HomePage.jsx";
import LoginPage from "./pages/Public/LoginPage.jsx";
import RegisterPage from "./pages/Public/RegisterPage.jsx";

import OwnerDashboard from "./pages/Owner/OwnerDashboard.jsx";
import SubmitDevicePage from "./pages/Owner/SubmitDevicePage.jsx";
import MyDevicesPage from "./pages/Owner/MyDevicesPage.jsx";
import DeviceDetailPage from "./pages/Owner/DeviceDetailPage.jsx";
import DeviceResultPage from "./pages/Owner/DeviceResultPage.jsx";
import PaymentsPage from "./pages/Owner/PaymentsPage.jsx";
import DataRetrievalPage from "./pages/Owner/DataRetrievalPage.jsx";

import StaffDashboard from "./pages/Staff/StaffDashboard.jsx";
import ReviewDevicesPage from "./pages/Staff/ReviewDevicesPage.jsx";
import StaffOrdersPage from "./pages/Staff/StaffOrdersPage.jsx";
import StaffDraftsPage from "./pages/Staff/StaffDraftsPage.jsx";

import AdminDashboard from "./pages/Admin/AdminDashboard.jsx";
import ManageAccountsPage from "./pages/Admin/ManageAccountsPage.jsx";
import AdminDevicesPage from "./pages/Admin/AdminDevicesPage.jsx";

import ReportsPage from "./pages/Shared/ReportsPage.jsx";

import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute allowedRoles={["OWNER"]}>
                                <OwnerDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/submit-device"
                        element={
                            <ProtectedRoute allowedRoles={["OWNER"]}>
                                <SubmitDevicePage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/my-devices"
                        element={
                            <ProtectedRoute allowedRoles={["OWNER"]}>
                                <MyDevicesPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/devices/:id"
                        element={
                            <ProtectedRoute allowedRoles={["OWNER"]}>
                                <DeviceDetailPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/devices/:id/result"
                        element={
                            <ProtectedRoute allowedRoles={["OWNER"]}>
                                <DeviceResultPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/payments"
                        element={
                            <ProtectedRoute allowedRoles={["OWNER"]}>
                                <PaymentsPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/data-retrieval"
                        element={
                            <ProtectedRoute allowedRoles={["OWNER"]}>
                                <DataRetrievalPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/staff-dashboard"
                        element={
                            <ProtectedRoute allowedRoles={["STAFF"]}>
                                <StaffDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/review-devices"
                        element={
                            <ProtectedRoute allowedRoles={["STAFF", "ADMIN"]}>
                                <ReviewDevicesPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/staff-orders"
                        element={
                            <ProtectedRoute allowedRoles={["STAFF", "ADMIN"]}>
                                <StaffOrdersPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/staff-drafts"
                        element={
                            <ProtectedRoute allowedRoles={["STAFF", "ADMIN"]}>
                                <StaffDraftsPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/admin-dashboard"
                        element={
                            <ProtectedRoute allowedRoles={["ADMIN"]}>
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/manage-accounts"
                        element={
                            <ProtectedRoute allowedRoles={["ADMIN"]}>
                                <ManageAccountsPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/admin-devices"
                        element={
                            <ProtectedRoute allowedRoles={["ADMIN"]}>
                                <AdminDevicesPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/admin-reports"
                        element={
                            <ProtectedRoute allowedRoles={["STAFF", "ADMIN"]}>
                                <ReportsPage />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}