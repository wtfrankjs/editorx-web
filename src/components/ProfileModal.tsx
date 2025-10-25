import { X, User, Mail, Calendar, Shield, Award, TrendingUp, Image as ImageIcon, Edit, Camera, LogOut, Trash2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase, Profile, uploadToSupabase } from '../services/supabase';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  userId: string | null;
  userProfile: Profile | null;
}

export default function ProfileModal({ isOpen, onClose, onLogout, userId, userProfile }: ProfileModalProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'profile' | 'stats' | 'achievements'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalProcessed: 0,
    totalCreditsUsed: 0,
    favoriteModule: '-'
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const [editData, setEditData] = useState({
    name: '',
    email: '',
    avatar: '',
    memberSince: '',
    plan: 'free' as 'free' | 'starter' | 'pro' | 'enterprise',
    credits: 0
  });
  
  const [originalData, setOriginalData] = useState({
    name: '',
    email: '',
    avatar: '',
    memberSince: '',
    plan: 'free' as 'free' | 'starter' | 'pro' | 'enterprise',
    credits: 0
  });

  // Get user data from auth and profile on open
  useEffect(() => {
    console.log('ProfileModal: useEffect triggered', { isOpen, userId, userProfile });
    
    if (!isOpen) {
      console.log('ProfileModal: Modal closed, skipping data load');
      return;
    }
    
    if (!userId) {
      console.log('ProfileModal: No userId, skipping data load');
      return;
    }
    
    const loadUserData = async () => {
      try {
        console.log('ProfileModal: Starting to load user data...');
        
        // If userProfile is not available yet, fetch it
        let profile = userProfile;
        if (!profile) {
          console.log('ProfileModal: userProfile not available, fetching...');
          const { getUserProfile } = await import('../services/supabase');
          profile = await getUserProfile(userId);
          console.log('ProfileModal: Fetched profile:', profile);
        }
        
        // Get auth data
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('ProfileModal: Auth error:', authError);
          return;
        }
        
        console.log('ProfileModal: User from auth:', user);
        console.log('ProfileModal: User metadata:', user?.user_metadata);
        console.log('ProfileModal: UserProfile prop:', userProfile);
        
        if (user) {
          // Get email and metadata from auth
          const email = user.email || 'No email';
          const meta: any = user.user_metadata || {};
          
          // Try multiple possible name fields from OAuth providers
          const name = meta.full_name || 
                      meta.name || 
                      meta.user_name || 
                      meta.preferred_username || 
                      (meta.given_name && meta.family_name ? `${meta.given_name} ${meta.family_name}` : '') ||
                      profile?.full_name || 
                      email.split('@')[0] || 
                      'User';
          
          // Try multiple possible avatar fields from OAuth providers
          const avatar = meta.avatar_url || 
                        meta.picture || 
                        meta.avatar || 
                        profile?.avatar_url || 
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`;
          
          // Parse member since date properly
          let memberSince = user.created_at || new Date().toISOString();
          if (profile?.created_at) {
            memberSince = profile.created_at;
          }
          
          const userData = {
            name,
            email,
            avatar,
            memberSince,
            plan: (profile?.membership_tier || 'free') as 'free' | 'starter' | 'pro' | 'enterprise',
            credits: profile?.credits || 0
          };
          
          console.log('ProfileModal: Final userData to display:', userData);
          setEditData(userData);
          setOriginalData(userData);
        } else {
          console.log('ProfileModal: No user found in auth');
        }
      } catch (error) {
        console.error('ProfileModal: Error loading user data:', error);
      }
    };
    
    loadUserData();
  }, [isOpen, userId, userProfile]);

  // Reset editing mode when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
    }
  }, [isOpen]);

  // Fetch user stats from database
  useEffect(() => {
    if (!userId || !isOpen) return;

    const fetchStats = async () => {
      try {
        // Get processing history count
        const { count: totalProcessed } = await supabase
          .from('processing_history')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        // Get total credits used
        const { data: transactions } = await supabase
          .from('credit_transactions')
          .select('amount')
          .eq('user_id', userId)
          .eq('type', 'usage');

        const totalCreditsUsed = transactions?.reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;

        // Get favorite module
        const { data: history } = await supabase
          .from('processing_history')
          .select('module')
          .eq('user_id', userId);

        const moduleCounts: Record<string, number> = {};
        history?.forEach((h: any) => {
          const key = h.module;
          if (!key) return;
          moduleCounts[key] = (moduleCounts[key] || 0) + 1;
        });

        const favoriteModule = Object.keys(moduleCounts).length > 0
          ? Object.entries(moduleCounts).sort((a, b) => b[1] - a[1])[0][0]
          : '-';

        setStats({
          totalProcessed: totalProcessed || 0,
          totalCreditsUsed,
          favoriteModule
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, [userId, isOpen]);

  const handleSave = async () => {
    if (!userId) return;
    setIsSaving(true);
    setSaveMessage(null);
    try {
      // 1) Update auth metadata (name/avatar) and optionally email
      const updates: any = { data: { full_name: editData.name, avatar_url: editData.avatar } };
      if (editData.email && editData.email !== originalData.email) {
        updates.email = editData.email;
      }
      const { error: authError } = await supabase.auth.updateUser(updates);
      if (authError) throw authError;

      // 2) Upsert into profiles table to keep canonical profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: editData.name,
          avatar_url: editData.avatar,
          // Do not change credits/plan here; managed elsewhere
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      if (profileError) throw profileError;

      setOriginalData(editData);
      setIsEditing(false);
      setSaveMessage(t('profile.saved') || 'Profil güncellendi');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setSaveMessage(error?.message || 'Profil güncellenemedi');
    } finally {
      setIsSaving(false);
      // Auto-hide message after a short delay
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    try {
      setIsSaving(true);
      const publicUrl = await uploadToSupabase(file);
      setEditData(prev => ({ ...prev, avatar: publicUrl }));
      // Persist immediately to auth metadata and profile
      const { error: authError } = await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      if (authError) throw authError;
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ id: userId, avatar_url: publicUrl, updated_at: new Date().toISOString() }, { onConflict: 'id' });
      if (profileError) throw profileError;
      setSaveMessage(t('profile.avatarUpdated') || 'Avatar güncellendi');
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      setSaveMessage(error?.message || 'Avatar yüklenemedi');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const achievements = [
    { id: 1, name: t('achievements.firstStep') || 'İlk Adım', desc: t('achievements.firstStepDesc') || 'İlk görselini düzenle', icon: '🎯', unlocked: true },
    { id: 2, name: t('achievements.quickStart') || 'Hızlı Başlangıç', desc: t('achievements.quickStartDesc') || '10 görsel düzenle', icon: '⚡', unlocked: true },
    { id: 3, name: t('achievements.professional') || 'Profesyonel', desc: t('achievements.professionalDesc') || '100 görsel düzenle', icon: '🏆', unlocked: false },
    { id: 4, name: t('achievements.expert') || 'Uzman', desc: t('achievements.expertDesc') || '500 görsel düzenle', icon: '👑', unlocked: false },
    { id: 5, name: t('achievements.master') || 'Master', desc: t('achievements.masterDesc') || '1000 görsel düzenle', icon: '💎', unlocked: false },
    { id: 6, name: t('achievements.diversity') || 'Çeşitlilik', desc: t('achievements.diversityDesc') || 'Tüm modülleri kullan', icon: '🌈', unlocked: true }
  ];

  const statsDisplay = [
    { label: t('profile.totalProcessed') || 'Toplam İşlem', value: stats.totalProcessed, icon: ImageIcon, color: 'text-blue-400' },
    { label: t('profile.totalCreditsUsed') || 'Kullanılan Kredi', value: stats.totalCreditsUsed, icon: TrendingUp, color: 'text-green-400' },
    { label: t('profile.favoriteModule') || 'Favori Modül', value: stats.favoriteModule, icon: Award, color: 'text-purple-400' }
  ];

  if (!isOpen) return null;

  const tabs = [
    { id: 'profile', name: t('profile.title') || 'Profil', icon: User },
    { id: 'stats', name: t('profile.stats') || 'İstatistikler', icon: TrendingUp },
    { id: 'achievements', name: t('profile.achievements') || 'Başarımlar', icon: Award }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#0C0C0F] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-800 animate-scale-in flex flex-col">
        {/* Header with Cover */}
      <div className="relative h-32 bg-gradient-to-r from-[#A97FFF] via-[#7C5DFF] to-[#A97FFF] overflow-visible flex-shrink-0">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-all"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
          
          {/* Avatar */}
          <div className="absolute -bottom-12 left-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl border-4 border-white dark:border-[#0C0C0F] overflow-hidden bg-white dark:bg-gray-800 shadow-2xl">
                <img
                  src={editData.avatar}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              {isEditing && (
                <>
                  <button
                    type="button"
                    onClick={handleAvatarClick}
                    className="absolute bottom-0 right-0 p-1.5 bg-[#A97FFF] hover:bg-[#B88FFF] rounded-lg shadow-lg transition-all"
                    disabled={isSaving}
                    title={t('profile.changeAvatar') || 'Avatar değiştir'}
                  >
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="pt-16 px-8 pb-6 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="text-2xl font-bold text-gray-800 dark:text-white bg-gray-100 dark:bg-[#1A1A22] px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 focus:border-[#A97FFF] focus:outline-none mb-2"
                />
              ) : (
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
                  {editData.name}
                </h2>
              )}
              
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {/* Email cannot be changed (tied to OAuth provider) */}
                  <span className="text-gray-600 dark:text-gray-400">{editData.email}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {t('history.member')}: {
                      editData.memberSince 
                        ? new Date(editData.memberSince).toLocaleDateString('tr-TR', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          }) 
                        : '-'
                    }
                  </span>
                </div>
              </div>

              <div className="mt-3">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-[#A97FFF] to-[#7C5DFF] text-white text-sm font-semibold rounded-full">
                  <Shield className="w-4 h-4" />
                  {editData.plan} {t('profile.plan') || 'Plan'}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`px-4 py-2 bg-gradient-to-r from-[#A97FFF] to-[#7C5DFF] hover:from-[#B88FFF] hover:to-[#8C6DFF] text-white rounded-lg transition-all font-medium ${isSaving ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {isSaving ? (t('profile.saving') || 'Kaydediliyor...') : t('profile.save')}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditData({ ...originalData });
                    }}
                    className="px-4 py-2 bg-gray-200 dark:bg-[#1A1A22] hover:bg-gray-300 dark:hover:bg-[#242430] text-gray-800 dark:text-white rounded-lg transition-all font-medium"
                  >
                    {t('profile.cancel')}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-gray-200 dark:bg-[#1A1A22] hover:bg-gray-300 dark:hover:bg-[#242430] text-gray-800 dark:text-white rounded-lg transition-all font-medium flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  {t('profile.edit')}
                </button>
              )}
            </div>
          </div>
          {saveMessage && (
            <div className="mt-3 px-4 py-2 rounded-lg text-sm border bg-gray-50 dark:bg-[#1A1A22] border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300">
              {saveMessage}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="px-8 pt-6 flex-shrink-0">
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 font-medium transition-all relative ${
                    activeTab === tab.id
                      ? 'text-[#A97FFF]'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.name}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#A97FFF]"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-8 overflow-y-auto flex-1">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-[#1A1A22] rounded-xl">
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">{t('profile.accountType')}</p>
                  <p className="text-gray-800 dark:text-white font-semibold">{editData.plan} {t('profile.plan')}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-[#1A1A22] rounded-xl">
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">{t('profile.membershipDate')}</p>
                  <p className="text-gray-800 dark:text-white font-semibold">
                    {editData.memberSince ? new Date(editData.memberSince).toLocaleDateString('tr-TR', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    }) : '-'}
                  </p>
                </div>
              </div>

              <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#1A1A22] dark:to-[#242430] rounded-2xl border border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#A97FFF]" />
                  {t('profile.accountSecurity')}
                </h3>
                <div className="space-y-3">
                  <button 
                    onClick={async () => {
                      try {
                        const { error } = await supabase.auth.resetPasswordForEmail(editData.email, {
                          redirectTo: `${window.location.origin}/editor/`
                        });
                        if (error) throw error;
                        setSaveMessage('Şifre sıfırlama e-postası gönderildi');
                        setTimeout(() => setSaveMessage(null), 3000);
                      } catch (error: any) {
                        console.error('Password reset error:', error);
                        setSaveMessage(error?.message || 'Şifre sıfırlama başarısız');
                        setTimeout(() => setSaveMessage(null), 3000);
                      }
                    }}
                    className="w-full p-3 bg-white dark:bg-[#0C0C0F] hover:bg-gray-50 dark:hover:bg-[#1A1A22] rounded-lg text-left text-gray-800 dark:text-white transition-all border border-gray-200 dark:border-gray-800"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{t('history.changePassword') || 'Şifre Değiştir'}</span>
                      <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </div>
                  </button>
                  <button 
                    onClick={() => {
                      setSaveMessage('İki faktörlü doğrulama yakında eklenecek');
                      setTimeout(() => setSaveMessage(null), 3000);
                    }}
                    className="w-full p-3 bg-white dark:bg-[#0C0C0F] hover:bg-gray-50 dark:hover:bg-[#1A1A22] rounded-lg text-left text-gray-800 dark:text-white transition-all border border-gray-200 dark:border-gray-800"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{t('history.twoFactor') || 'İki Faktörlü Doğrulama'}</span>
                      <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">{t('history.twoFactorOff') || 'Kapalı'}</span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={onLogout}
                  className="w-full p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 font-medium transition-all flex items-center justify-center gap-2"
                >
                  <LogOut className="w-5 h-5" />
                  {t('profile.logout') || 'Çıkış Yap'}
                </button>
                <button 
                  onClick={() => {
                    if (window.confirm('Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
                      setSaveMessage('Hesap silme özelliği yakında eklenecek');
                      setTimeout(() => setSaveMessage(null), 3000);
                    }
                  }}
                  className="w-full p-4 bg-white dark:bg-gray-800/30 hover:bg-red-500/10 border border-gray-300 dark:border-gray-700 hover:border-red-500/30 rounded-xl text-gray-600 dark:text-gray-400 hover:text-red-400 font-medium transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  {t('profile.deleteAccount') || 'Hesabı Sil'}
                </button>
              </div>
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                {statsDisplay.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={index}
                      className="p-6 bg-gray-50 dark:bg-[#1A1A22] rounded-2xl border border-gray-200 dark:border-gray-800"
                    >
                      <div className={`p-3 ${stat.color} bg-opacity-10 rounded-xl inline-block mb-3`}>
                        <Icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-800 dark:text-white">{stat.value}</p>
                    </div>
                  );
                })}
              </div>

              <div className="p-6 bg-gray-50 dark:bg-[#1A1A22] rounded-2xl border border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('profile.moduleUsage') || 'Modül Kullanım İstatistikleri'}</h3>
                <div className="space-y-4">
                  {[
                    { name: 'Upscale', usage: 850, color: 'bg-blue-500' },
                    { name: 'Remove BG', usage: 620, color: 'bg-green-500' },
                    { name: 'Smart Crop', usage: 480, color: 'bg-purple-500' },
                    { name: 'Enhance', usage: 280, color: 'bg-yellow-500' }
                  ].map((module) => (
                    <div key={module.name}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-800 dark:text-white font-medium">{module.name}</span>
                        <span className="text-gray-600 dark:text-gray-400">{module.usage} {t('history.usageCount')}</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${module.color} transition-all duration-500`}
                          style={{ width: `${(module.usage / 850) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Achievements Tab */}
          {activeTab === 'achievements' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`p-6 rounded-2xl border-2 transition-all ${
                      achievement.unlocked
                        ? 'bg-gradient-to-br from-[#A97FFF]/20 to-[#7C5DFF]/20 border-[#A97FFF]'
                        : 'bg-gray-50 dark:bg-[#1A1A22] border-gray-200 dark:border-gray-800 opacity-50'
                    }`}
                  >
                    <div className="text-center">
                      <div className={`text-5xl mb-3 ${achievement.unlocked ? '' : 'grayscale'}`}>
                        {achievement.icon}
                      </div>
                      <h4 className="text-gray-800 dark:text-white font-semibold mb-1">
                        {achievement.name}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {achievement.desc}
                      </p>
                      {achievement.unlocked && (
                        <div className="mt-3 inline-flex items-center gap-1 text-green-400 text-sm font-medium">
                          <Award className="w-4 h-4" />
                          {t('achievements.unlocked') || 'Kazanıldı'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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






