
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import AuthLayout from "./components/AuthLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Occurrences from "./pages/Occurrences";
import Users from "./pages/Users";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>
          
          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="ocorrencias" element={<Occurrences />} />
            <Route path="profile" element={<Profile />} />
            
            {/* Admin-only routes */}
            <Route path="usuarios" element={
              <ProtectedRoute requireAdmin={true}>
                <Users />
              </ProtectedRoute>
            } />
            
            {/* Add other admin routes when implemented */}
            {/* 
            <Route path="delegacias" element={
              <ProtectedRoute requireAdmin={true}>
                <PoliceStations />
              </ProtectedRoute>
            } />
            <Route path="permissoes" element={
              <ProtectedRoute requireAdmin={true}>
                <Permissions />
              </ProtectedRoute>
            } /> 
            */}
          </Route>
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
