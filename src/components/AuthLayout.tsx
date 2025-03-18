import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center p-4 sm:py-12">
      <div className="mx-auto w-full sm:max-w-md">
        <div className="bg-white py-6 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="flex justify-center mb-6">
            <img 
              src="/logo_dark.png" 
              alt="Logo Vigilantes"
              className="w-40 sm:w-48 md:w-56"
            />
          </div>
          <p className="mb-8 text-center text-sm text-gray-600">
            Sistema de Registro de Ocorrências
          </p>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
