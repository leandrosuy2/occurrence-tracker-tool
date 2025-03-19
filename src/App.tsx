import React, { useEffect, useState } from 'react';
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
import PoliceStations from "./pages/PoliceStations";
import Permissions from "./pages/Permissions";
import "./services/websocket";
import { NewOccurrenceModal } from './components/NewOccurrenceModal';
import { Occurrence } from '@/types';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import authService from '@/services/authService';

const queryClient = new QueryClient();

const App = () => {
  const [newOccurrence, setNewOccurrence] = useState<Occurrence | null>(null);

  useEffect(() => {
    const handleNewOccurrence = (event: CustomEvent<Occurrence>) => {
      console.log('App - Nova ocorrência recebida:', event.detail);
      const isAdmin = authService.isAdmin();
      console.log('App - Usuário é admin:', isAdmin);
      if (isAdmin) {
        console.log('App - Atualizando estado com nova ocorrência');
        setNewOccurrence(event.detail);
      }
    };

    console.log('App - Registrando listener de newOccurrence');
    window.addEventListener('newOccurrence', handleNewOccurrence as EventListener);
    return () => {
      console.log('App - Removendo listener de newOccurrence');
      window.removeEventListener('newOccurrence', handleNewOccurrence as EventListener);
    };
  }, []);

  const handleAcceptOccurrence = (occurrence: Occurrence) => {
    console.log('App - Ocorrência aceita:', occurrence);
    toast.success('Ocorrência aceita com sucesso!');
  };

  const handleRejectOccurrence = () => {
    console.log('App - Ocorrência rejeitada');
    toast.info('Ocorrência rejeitada');
  };

  const handleCloseModal = () => {
    console.log('App - Fechando modal');
    setNewOccurrence(null);
  };

  useEffect(() => {
    console.log('App - Estado atual da ocorrência:', newOccurrence);
  }, [newOccurrence]);

  return (
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
            </Route>
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>

        {/* Modal de Nova Ocorrência */}
        <NewOccurrenceModal
          occurrence={newOccurrence}
          onClose={handleCloseModal}
          onAccept={handleAcceptOccurrence}
          onReject={handleRejectOccurrence}
        />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
