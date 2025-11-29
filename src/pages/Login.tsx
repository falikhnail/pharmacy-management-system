import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Eye, EyeOff, Pill, Lock, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { storageService } from '@/lib/storage';
import { User } from '@/types';

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('Username dan password harus diisi');
      return;
    }

    setIsLoading(true);

    try {
      const users = storageService.getUsers();
      const user = users.find(u => u.username === username && u.password === password && u.isActive);

      if (user) {
        const updatedUser = { ...user, lastLogin: new Date().toISOString() };
        const updatedUsers = users.map(u => u.id === user.id ? updatedUser : u);
        storageService.saveUsers(updatedUsers);
        storageService.setCurrentUser(updatedUser);
        
        // Set auth token
        localStorage.setItem('authToken', 'authenticated');
        
        toast.success(`Selamat datang, ${user.nama}!`);
        
        // Call onLogin callback
        onLogin(updatedUser);
      } else {
        toast.error('Username atau password salah!');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Terjadi kesalahan saat login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md relative z-10 shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <div className="p-8">
          {/* Logo and Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg transform hover:scale-105 transition-transform">
              <Pill className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Apotek Sehat Sentosa</h1>
            <p className="text-gray-500 text-center">Sistem Manajemen Apotek</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700 font-medium">
                Username
              </Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Masukkan username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-12 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">Ingat saya</span>
              </label>
              <a href="#" className="text-sm text-blue-500 hover:text-blue-600 font-medium">
                Lupa password?
              </a>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Memproses...</span>
                </div>
              ) : (
                'Masuk'
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Belum punya akun?{' '}
              <a href="#" className="text-blue-500 hover:text-blue-600 font-medium">
                Hubungi Administrator
              </a>
            </p>
          </div>
        </div>
      </Card>

      {/* Additional Info Card */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center">
        <p className="text-sm text-gray-500">
          © 2024 Pharmacy Management System. All rights reserved.
        </p>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}