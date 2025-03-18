import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Button } from '@/components/ui/button';
import { User, LogOut, Menu } from 'lucide-react';
import authService from '@/services/authService';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import PanicButton from './PanicButton';

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-muted/30">
      {!isMobile && <Sidebar className="hidden md:block" />}
      
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white border-b h-16 flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center gap-4">
            {isMobile && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0">
                  <Sidebar className="w-full border-none" />
                </SheetContent>
              </Sheet>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => navigate('/profile')}
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{user?.name || 'Perfil'}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>

        {/* Panic Button - Available throughout the app */}
        <PanicButton />
      </div>
    </div>
  );
};

export default Layout;
