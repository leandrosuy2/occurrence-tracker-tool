let isAdmin = false;

export const setAdminStatus = (status: boolean) => {
  // console.log('Definindo status de admin:', status);
  isAdmin = status;
};

export const getAdminStatus = () => {
  return isAdmin;
}; 