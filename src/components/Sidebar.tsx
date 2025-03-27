import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Home, FileText, MapPin, Users, Shield } from 'lucide-react';
import authService from '@/services/authService';

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAdmin = () => {
      const user = authService.getCurrentUser();
      if (user) {
        console.log('Sidebar - Dados do usuário:', user);
        const adminStatus = authService.isAdmin();
        console.log('Sidebar - Status de admin:', adminStatus);
        setIsAdmin(adminStatus);
      }
    };

    checkAdmin();
    // Verificar a cada 1 segundo para garantir que o estado está atualizado
    const interval = setInterval(checkAdmin, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user) {
      setUser(user);
    }
  }, [user]);

  return (
    <div className={cn(
      "w-64 bg-ocorrencia-azul-escuro text-white flex flex-col h-full",
      className
    )}>
      <div className="flex justify-center p-4">
        <img 
          src="/logo.png" 
          alt="Logo Vigilantes" 
          className="w-auto md:w-48 sm:w-32"
        />
      </div>
      
      <nav className="flex-1 px-4 py-2 space-y-1">
        <NavLink
          to="/"
          className={({ isActive }) =>
            cn(
              "flex items-center px-4 py-2 rounded-md transition-colors",
              isActive
                ? "bg-ocorrencia-azul-medio text-white"
                : "text-gray-300 hover:bg-ocorrencia-azul-medio/40 hover:text-white"
            )
          }
        >
          <Home className="mr-3 h-5 w-5" />
          <span>Dashboard</span>
        </NavLink>
        
        <NavLink
          to="/ocorrencias"
          className={({ isActive }) =>
            cn(
              "flex items-center px-4 py-2 rounded-md transition-colors",
              isActive
                ? "bg-ocorrencia-azul-medio text-white"
                : "text-gray-300 hover:bg-ocorrencia-azul-medio/40 hover:text-white"
            )
          }
        >
          <FileText className="mr-3 h-5 w-5" />
          <span>Ocorrências</span>
        </NavLink>
        
        {isAdmin && (
          <>
            <NavLink
              to="/delegacias"
              className={({ isActive }) =>
                cn(
                  "flex items-center px-4 py-2 rounded-md transition-colors",
                  isActive
                    ? "bg-ocorrencia-azul-medio text-white"
                    : "text-gray-300 hover:bg-ocorrencia-azul-medio/40 hover:text-white"
                )
              }
            >
              <MapPin className="mr-3 h-5 w-5" />
              <span>Delegacias</span>
            </NavLink>
            
            <NavLink
              to="/usuarios"
              className={({ isActive }) =>
                cn(
                  "flex items-center px-4 py-2 rounded-md transition-colors",
                  isActive
                    ? "bg-ocorrencia-azul-medio text-white"
                    : "text-gray-300 hover:bg-ocorrencia-azul-medio/40 hover:text-white"
                )
              }
            >
              <Users className="mr-3 h-5 w-5" />
              <span>Usuários</span>
            </NavLink>
            
            <NavLink
              to="/permissoes"
              className={({ isActive }) =>
                cn(
                  "flex items-center px-4 py-2 rounded-md transition-colors",
                  isActive
                    ? "bg-ocorrencia-azul-medio text-white"
                    : "text-gray-300 hover:bg-ocorrencia-azul-medio/40 hover:text-white"
                )
              }
            >
              <Shield className="mr-3 h-5 w-5" />
              <span>Permissões</span>
            </NavLink>
          </>
        )}
      </nav>
      
      <div className="p-4 border-t border-ocorrencia-azul-medio/30">
        <div className="text-xs text-gray-300 text-center">
          Sistema de Registro de Ocorrências &copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
