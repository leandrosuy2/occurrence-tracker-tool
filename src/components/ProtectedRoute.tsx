import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authService from '@/services/authService';
import api from '@/services/api';
import { basePathUrlApiV1 } from '@/services/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const isAuthenticated = authService.isAuthenticated();
  const isAdmin = authService.isAdmin();

  useEffect(() => {
    const validateToken = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        // Usa a rota de perfil do usuário para validar o token
        await api.get(`${basePathUrlApiV1}/users/profile`);
        setIsValid(true);
      } catch (error) {
        // Se o token for inválido, limpa o localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [isAuthenticated]);

  if (isLoading) {
    return <div>Carregando...</div>; // Você pode substituir por um componente de loading mais elaborado
  }

  if (!isAuthenticated || !isValid) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
