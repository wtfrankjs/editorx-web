import { X, Mail, Lock, User, Eye, EyeOff, Chrome, Github, Apple, Sparkles, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../services/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (mode === 'register' && !formData.name.trim()) {
      newErrors.name = 'İsim gerekli';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-posta gerekli';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi girin';
    }

    if (!formData.password) {
      newErrors.password = 'Şifre gerekli';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalı';
    }

    if (mode === 'register') {
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Şifreler eşleşmiyor';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      if (mode === 'register') {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.name,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          onSuccess({
            id: data.user.id,
            name: formData.name,
            email: formData.email,
            balance: 100.00,
          });
          onClose();
        }
      } else {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        if (data.user) {
          onSuccess({
            id: data.user.id,
            name: data.user.user_metadata.full_name || data.user.email,
            email: data.user.email,
            balance: 100.00,
          });
          onClose();
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      alert(error.message || 'Giriş başarısız');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github' | 'apple') => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Social login error:', error);
      alert(error.message || 'Sosyal giriş başarısız');
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#0C0C0F] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-800 animate-scale-in">
        {/* Header with Gradient */}
        <div className="relative bg-gradient-to-r from-[#A97FFF] to-[#7C5DFF] p-8 pb-12">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-all"
          >
            <X className="w-5 h-5 text-gray-900 dark:text-white" />
          </button>
          
          <div className="text-center">
            <div className="inline-flex p-3 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
              <Sparkles className="w-8 h-8 text-gray-900 dark:text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {mode === 'login' ? 'Tekrar Hoş Geldin!' : 'Hesap Oluştur'}
            </h2>
            <p className="text-gray-900 dark:text-white/80 text-sm mt-2">
              {mode === 'login' 
                ? 'Görsel düzenleme macerana devam et' 
                : 'Profesyonel görsel düzenleme dünyasına katıl'}
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="p-8 -mt-6">
          {/* Tab Switcher */}
          <div className="bg-gray-100 dark:bg-[#1A1A22] rounded-xl p-1 flex gap-1 mb-6">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-[#A97FFF] to-[#7C5DFF] text-gray-900 dark:text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white'
              }`}
            >
              Giriş Yap
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-[#A97FFF] to-[#7C5DFF] text-gray-900 dark:text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white'
              }`}
            >
              Kayıt Ol
            </button>
          </div>

          {/* Social Login */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleSocialLogin('google')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-100 dark:bg-[#1A1A22] hover:bg-gray-200 dark:hover:bg-[#242430] text-gray-800 dark:text-white rounded-xl transition-all border border-gray-200 dark:border-gray-800"
            >
              <Chrome className="w-5 h-5" />
              <span className="font-medium">Google ile devam et</span>
            </button>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSocialLogin('github')}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-[#1A1A22] hover:bg-gray-200 dark:hover:bg-[#242430] text-gray-800 dark:text-white rounded-xl transition-all border border-gray-200 dark:border-gray-800"
              >
                <Github className="w-5 h-5" />
                <span className="font-medium">GitHub</span>
              </button>
              <button
                onClick={() => handleSocialLogin('apple')}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-[#1A1A22] hover:bg-gray-200 dark:hover:bg-[#242430] text-gray-800 dark:text-white rounded-xl transition-all border border-gray-200 dark:border-gray-800"
              >
                <Apple className="w-5 h-5" />
                <span className="font-medium">Apple</span>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-[#0C0C0F] text-gray-500">
                veya e-posta ile
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ad Soyad
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    className={`w-full bg-gray-100 dark:bg-[#1A1A22] text-gray-800 dark:text-white pl-10 pr-4 py-3 rounded-xl border ${
                      errors.name ? 'border-red-500' : 'border-gray-200 dark:border-gray-800'
                    } focus:border-[#A97FFF] focus:outline-none transition-all`}
                  />
                </div>
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                E-posta
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ornek@email.com"
                  className={`w-full bg-gray-100 dark:bg-[#1A1A22] text-gray-800 dark:text-white pl-10 pr-4 py-3 rounded-xl border ${
                    errors.email ? 'border-red-500' : 'border-gray-200 dark:border-gray-800'
                  } focus:border-[#A97FFF] focus:outline-none transition-all`}
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Şifre
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className={`w-full bg-gray-100 dark:bg-[#1A1A22] text-gray-800 dark:text-white pl-10 pr-12 py-3 rounded-xl border ${
                    errors.password ? 'border-red-500' : 'border-gray-200 dark:border-gray-800'
                  } focus:border-[#A97FFF] focus:outline-none transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Şifre Tekrar
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    className={`w-full bg-gray-100 dark:bg-[#1A1A22] text-gray-800 dark:text-white pl-10 pr-4 py-3 rounded-xl border ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-200 dark:border-gray-800'
                    } focus:border-[#A97FFF] focus:outline-none transition-all`}
                  />
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>
            )}

            {mode === 'login' && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-[#A97FFF] focus:ring-[#A97FFF]" />
                  <span className="text-gray-600 dark:text-gray-400">Beni hatırla</span>
                </label>
                <button type="button" className="text-[#A97FFF] hover:text-[#B88FFF] transition-colors">
                  Şifremi unuttum?
                </button>
              </div>
            )}

            {mode === 'register' && (
              <div className="flex items-start gap-2">
                <input type="checkbox" className="w-4 h-4 mt-1 rounded border-gray-300 dark:border-gray-700 text-[#A97FFF] focus:ring-[#A97FFF]" required />
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <a href="#" className="text-[#A97FFF] hover:text-[#B88FFF]">Kullanım Koşulları</a>'nı ve{' '}
                  <a href="#" className="text-[#A97FFF] hover:text-[#B88FFF]">Gizlilik Politikası</a>'nı kabul ediyorum.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-[#A97FFF] to-[#7C5DFF] hover:from-[#B88FFF] hover:to-[#8C6DFF] disabled:from-gray-600 disabled:to-gray-700 text-gray-900 dark:text-white rounded-xl font-semibold transition-all shadow-lg shadow-[#A97FFF]/20 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  İşleniyor...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  {mode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}
                </>
              )}
            </button>
          </form>

          {/* Benefits (Register mode) */}
          {mode === 'register' && (
            <div className="mt-6 p-4 bg-[#A97FFF]/10 border border-[#A97FFF]/30 rounded-xl">
              <p className="text-sm font-medium text-[#A97FFF] mb-2">Ücretsiz başla:</p>
              <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  <span>100 kredili hoş geldin bonusu</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  <span>Tüm AI modüllerine erişim</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  <span>Sınırsız görsel kaydetme</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}





