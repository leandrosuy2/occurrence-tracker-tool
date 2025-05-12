import React, { useEffect, useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { toast } from 'sonner';
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
import { connectNotificationWebSocket, disconnectNotificationWebSocket } from "./services/notificationWebSocket";
import { NewOccurrenceModal } from './components/NewOccurrenceModal';
import { Occurrence } from '@/types';
import authService from '@/services/authService';

const queryClient = new QueryClient();

const App = () => {
  const [newOccurrence, setNewOccurrence] = useState<Occurrence | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isNewOccurrenceModalOpen, setIsNewOccurrenceModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  // Verificar se o usuário é admin ao carregar a aplicação
  useEffect(() => {
    const checkAdmin = () => {
      try {
        const isAdminUser = authService.isAdmin();
        // console.log('Usuário é admin:', isAdminUser);
        setIsAdmin(isAdminUser);
      } catch (error) {
        console.error('Erro ao verificar admin:', error);
      }
    };
    checkAdmin();
  }, []);

  // Conectar ao WebSocket de notificações
  useEffect(() => {
    if (isAdmin) {
      connectNotificationWebSocket(isAdmin);
    }
    return () => {
      disconnectNotificationWebSocket();
    };
  }, [isAdmin]);

  // Efeito para lidar com novas ocorrências
  useEffect(() => {
    const handleNewOccurrence = (event: CustomEvent) => {
      console.log('App - Nova ocorrência recebida:', event.detail);
      console.log('App - Atualizando estado com nova ocorrência');
      setNewOccurrence(event.detail);
      setIsNewOccurrenceModalOpen(true);
      console.log('App - Estado do modal após atualização:', { 
        isAdmin, 
        hasNewOccurrence: !!event.detail, 
        isModalOpen: true 
      });
    };

    // console.log('App - Registrando listener de newOccurrence');
    window.addEventListener('newOccurrence', handleNewOccurrence as EventListener);

    return () => {
      // console.log('App - Removendo listener de newOccurrence');
      window.removeEventListener('newOccurrence', handleNewOccurrence as EventListener);
    };
  }, [isAdmin]);

  const handleAcceptOccurrence = (occurrence: any) => {
    console.log('App - Ocorrência aceita:', occurrence);
    setNewOccurrence(null);
    setIsNewOccurrenceModalOpen(false);
  };

  const handleRejectOccurrence = () => {
    console.log('App - Ocorrência rejeitada');
    setNewOccurrence(null);
    setIsNewOccurrenceModalOpen(false);
  };

  const handleCloseNewOccurrenceModal = () => {
    console.log('App - Fechando modal');
    setIsNewOccurrenceModalOpen(false);
  };

  const handleCloseChatModal = () => {
    console.log('App - Estado atual da ocorrência:', newOccurrence);
    // console.log('App - Usuário é admin:', isAdmin);
    setIsChatModalOpen(false);
  };

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
                <ProtectedRoute requireSuperAdmin={true}>
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
        {isAdmin && newOccurrence && isNewOccurrenceModalOpen && (
          <NewOccurrenceModal
            occurrence={newOccurrence}
            onClose={handleCloseNewOccurrenceModal}
            onAccept={handleAcceptOccurrence}
            onReject={handleRejectOccurrence}
          />
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
