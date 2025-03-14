
import { Navigate } from 'react-router-dom';
import authService from '@/services/authService';

const Index = () => {
  const isAuthenticated = authService.isAuthenticated();
  
  // If authenticated, let the ProtectedRoute in App.tsx handle the Dashboard rendering
  // If not authenticated, redirect to login
  return isAuthenticated ? <Navigate to="/" replace /> : <Navigate to="/login" replace />;
};

export default Index;
