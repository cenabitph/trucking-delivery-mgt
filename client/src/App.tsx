import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import RequireAuth from "./components/RequireAuth";
import Dashboard from "./pages/Dashboard";
import Loads from "./pages/Loads";
import LoadDetail from "./pages/LoadDetail";
import Drivers from "./pages/Drivers";
import Vehicles from "./pages/Vehicles";
import Customers from "./pages/Customers";
import Invoices from "./pages/Invoices";
import Companies from "./pages/Companies";
import Users from "./pages/Users";
import Login from "./pages/Login";
import ScanPage from "./pages/ScanPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/scan/:token" element={<ScanPage />} />
      <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="loads" element={<Loads />} />
        <Route path="loads/:id" element={<LoadDetail />} />
        <Route path="drivers" element={<Drivers />} />
        <Route path="vehicles" element={<Vehicles />} />
        <Route path="customers" element={<Customers />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="companies" element={<Companies />} />
        <Route path="users" element={<Users />} />
      </Route>
    </Routes>
  );
}
