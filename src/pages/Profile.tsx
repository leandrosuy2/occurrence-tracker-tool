import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from '@/types';
import userService from '@/services/userService';
import authService from '@/services/authService';
import { toast } from 'sonner';
import InputMask from 'react-input-mask';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    cpf: '',
    avatar: null as File | null,
    password: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [emailForm, setEmailForm] = useState({
    newEmail: '',
    confirmEmail: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await userService.getUserProfile();
        setUser(profile);

        setProfileForm({
          name: profile.name || '',
          email: profile.email || '',
          cpf: profile.cpf || '',
          avatar: null,
          password: '',
        });

        // Se houver avatar, atualizar a preview
        if (profile.avatar) {
          setAvatarPreview(profile.avatar);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Erro ao carregar perfil');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Tipo de arquivo inválido. Use JPG, PNG ou GIF.');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. O tamanho máximo é 5MB.');
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setProfileForm(prev => ({ ...prev, avatar: file }));

    // Cleanup preview URL when component unmounts
    return () => URL.revokeObjectURL(previewUrl);
  };

  const handleRemoveAvatar = async () => {
    try {
      const formData = new FormData();
      formData.append('name', profileForm.name);
      formData.append('email', profileForm.email);
      formData.append('cpf', removeMask(profileForm.cpf));
      formData.append('removeAvatar', 'true');

      const updatedUser = await userService.updateSelf(formData);

      setProfileForm(prev => ({ ...prev, avatar: null }));
      setAvatarPreview(null);

      // Atualizar dados do usuário no localStorage
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        currentUser.avatar = null;
        localStorage.setItem('user', JSON.stringify(currentUser));
      }

      // Atualizar o usuário no estado
      setUser(updatedUser);

      toast.success('Foto de perfil removida com sucesso');
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast.error('Erro ao remover foto de perfil');
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEmailForm((prev) => ({ ...prev, [name]: value }));
  };

  const removeMask = (value: string) => {
    return value.replace(/[^\d]/g, '');
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    if (!profileForm.password) {
      toast.error('A senha é obrigatória');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', profileForm.name);
      formData.append('email', profileForm.email);
      formData.append('cpf', removeMask(profileForm.cpf));
      formData.append('password', profileForm.password);

      // Corrigindo o envio do avatar
      if (profileForm.avatar instanceof File) {
        formData.append('avatar', profileForm.avatar);
      }

      const updatedUser = await userService.updateSelf(formData);

      // Atualizar dados do usuário no localStorage
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        currentUser.name = profileForm.name;
        currentUser.email = profileForm.email;
        currentUser.cpf = profileForm.cpf;
        currentUser.avatar = updatedUser.avatar;
        localStorage.setItem('user', JSON.stringify(currentUser));
      }

      // Atualizar o usuário no estado
      setUser(updatedUser);

      // Limpar o campo de senha após a atualização
      setProfileForm(prev => ({ ...prev, password: '' }));

      toast.success('Perfil atualizado com sucesso');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    try {
      await authService.changePassword(passwordForm.currentPassword, passwordForm.newPassword);

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      toast.success('Senha alterada com sucesso');
    } catch (error) {
      console.error('Error changing password:', error);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (emailForm.newEmail !== emailForm.confirmEmail) {
      toast.error('Os e-mails não coincidem');
      return;
    }

    try {
      await authService.changeEmail(user?.email || '', emailForm.newEmail);

      setEmailForm({
        newEmail: '',
        confirmEmail: '',
      });

      // Atualizar o formulário de perfil com o novo e-mail
      setProfileForm((prev) => ({ ...prev, email: emailForm.newEmail }));

      toast.success('E-mail alterado com sucesso');
    } catch (error) {
      console.error('Error changing email:', error);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.')) {
      try {
        await userService.deleteSelf();
        window.location.href = '/login';
      } catch (error) {
        console.error('Error deleting account:', error);
        toast.error('Erro ao excluir conta');
      }
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Carregando perfil...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Meu Perfil</h1>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais e credenciais
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="mb-4">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          {/* <TabsTrigger value="password">Senha</TabsTrigger>
          <TabsTrigger value="email">E-mail</TabsTrigger> */}
          <TabsTrigger value="danger">Conta</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Perfil</CardTitle>
              <CardDescription>
                Atualize suas informações pessoais
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user?.isAdmin ? (
                <div className="text-center p-4">
                  <p>Administradores não podem alterar informações de perfil.</p>
                </div>
              ) : (
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <Label className="text-center block">Foto de Perfil</Label>
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <Avatar className="w-32 h-32">
                        <AvatarImage
                          src={avatarPreview || user?.avatar}
                          alt="Foto de perfil"
                        />
                        <AvatarFallback>
                          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-2 text-center">
                        <div className="flex justify-center gap-2">
                          <Input
                            id="avatar"
                            name="avatar"
                            type="file"
                            accept="image/jpeg,image/png,image/gif"
                            onChange={handleAvatarChange}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('avatar')?.click()}
                          >
                            Escolher foto
                          </Button>
                          {(user?.avatar || avatarPreview) && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleRemoveAvatar}
                              className="text-ocorrencia-vermelho hover:text-ocorrencia-vermelho/90"
                            >
                              Remover foto
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          JPG, PNG ou GIF. Tamanho máximo de 5MB.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo</Label>
                    <Input
                      id="name"
                      name="name"
                      value={profileForm.name}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={profileForm.email}
                      onChange={handleProfileChange}
                      required
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">
                      Para alterar seu e-mail, use a aba "E-mail"
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <InputMask
                      mask="999.999.999-99"
                      value={profileForm.cpf}
                      onChange={handleProfileChange}
                      required
                    >
                      {(inputProps: any) => (
                        <Input
                          {...inputProps}
                          id="cpf"
                          name="cpf"
                          placeholder="000.000.000-00"
                        />
                      )}
                    </InputMask>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={profileForm.password}
                      onChange={handleProfileChange}
                      placeholder="Digite sua senha"
                      required
                    />
                  </div>

                  <Button type="submit" className="bg-ocorrencia-azul-escuro hover:bg-ocorrencia-azul-medio">
                    Salvar Alterações
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Alteração de Senha</CardTitle>
              <CardDescription>
                Altere sua senha de acesso ao sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Senha atual</Label>
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova senha</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirme a nova senha</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>

                <Button type="submit" className="bg-ocorrencia-azul-escuro hover:bg-ocorrencia-azul-medio">
                  Alterar Senha
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Alteração de E-mail</CardTitle>
              <CardDescription>
                Altere seu endereço de e-mail
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentEmail">E-mail atual</Label>
                  <Input
                    id="currentEmail"
                    value={user?.email || ''}
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newEmail">Novo e-mail</Label>
                  <Input
                    id="newEmail"
                    name="newEmail"
                    type="email"
                    value={emailForm.newEmail}
                    onChange={handleEmailChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmEmail">Confirme o novo e-mail</Label>
                  <Input
                    id="confirmEmail"
                    name="confirmEmail"
                    type="email"
                    value={emailForm.confirmEmail}
                    onChange={handleEmailChange}
                    required
                  />
                </div>

                <Button type="submit" className="bg-ocorrencia-azul-escuro hover:bg-ocorrencia-azul-medio">
                  Alterar E-mail
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger">
          <Card>
            <CardHeader>
              <CardTitle className="text-ocorrencia-vermelho">Zona de Perigo</CardTitle>
              <CardDescription>
                Operações irreversíveis relacionadas à sua conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-md p-4 bg-red-50">
                  <h3 className="font-medium text-ocorrencia-vermelho">Excluir Conta</h3>
                  <p className="text-sm text-gray-500 mt-2 mb-4">
                    Uma vez excluída, todos os seus dados serão permanentemente removidos.
                    Esta ação não pode ser desfeita.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                  >
                    Excluir minha conta
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
