import { X, Wallet, CreditCard, Zap, Crown, Star, Check, TrendingUp, Gift } from 'lucide-react';
import { useState } from 'react';

interface BalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  onPurchase: (amount: number) => void;
}

interface Package {
  id: string;
  amount: number;
  price: number;
  bonus: number;
  popular?: boolean;
  badge?: string;
}

export default function BalanceModal({ isOpen, onClose, currentBalance, onPurchase }: BalanceModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'crypto'>('card');

  const packages: Package[] = [
    {
      id: 'starter',
      amount: 10,
      price: 9.99,
      bonus: 0,
      badge: '🔥 Yeni'
    },
    {
      id: 'basic',
      amount: 50,
      price: 39.99,
      bonus: 5
    },
    {
      id: 'pro',
      amount: 100,
      price: 69.99,
      bonus: 15,
      popular: true,
      badge: '⭐ Popüler'
    },
    {
      id: 'premium',
      amount: 250,
      price: 149.99,
      bonus: 50,
      badge: '👑 Premium'
    },
    {
      id: 'enterprise',
      amount: 500,
      price: 249.99,
      bonus: 150,
      badge: '💎 Enterprise'
    }
  ];

  const handlePurchase = () => {
    if (!selectedPackage) return;
    
    const pkg = packages.find(p => p.id === selectedPackage);
    if (pkg) {
      onPurchase(pkg.amount + pkg.bonus);
      onClose();
    }
  };

  if (!isOpen) return null;

  const selectedPkg = packages.find(p => p.id === selectedPackage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#0C0C0F] rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-800 animate-scale-in">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#A97FFF] to-[#7C5DFF] p-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -ml-24 -mb-24"></div>
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-all z-10"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Wallet className="w-8 h-8" />
                  Bakiye Yükle
                </h2>
                <p className="text-white/80 text-sm mt-2">
                  Kredilerinizi artırın ve sınırsız düzenleme yapın
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/70 text-sm">Mevcut Bakiyeniz</p>
                <p className="text-3xl font-bold text-white">${currentBalance.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Packages Grid */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#A97FFF]" />
              Paket Seç
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {packages.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg.id)}
                  className={`relative p-6 rounded-2xl border-2 transition-all duration-200 ${
                    selectedPackage === pkg.id
                      ? 'border-[#A97FFF] bg-[#A97FFF]/10 shadow-lg shadow-[#A97FFF]/20'
                      : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1A1A22] hover:border-[#A97FFF]/50'
                  } ${pkg.popular ? 'ring-2 ring-[#A97FFF] ring-offset-2 ring-offset-[#0C0C0F]' : ''}`}
                >
                  {pkg.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-[#A97FFF] to-[#7C5DFF] rounded-full text-white text-xs font-bold whitespace-nowrap">
                      {pkg.badge}
                    </div>
                  )}
                  
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
                      ${pkg.amount}
                    </div>
                    
                    {pkg.bonus > 0 && (
                      <div className="flex items-center justify-center gap-1 text-green-400 text-sm font-semibold mb-3">
                        <Gift className="w-4 h-4" />
                        +${pkg.bonus} Bonus
                      </div>
                    )}
                    
                    <div className="text-2xl font-bold text-[#A97FFF] mb-2">
                      ${pkg.price}
                    </div>
                    
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Toplam: ${pkg.amount + pkg.bonus}
                    </div>
                    
                    {selectedPackage === pkg.id && (
                      <div className="mt-4 flex items-center justify-center">
                        <div className="p-2 bg-[#A97FFF] rounded-full">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          {selectedPackage && (
            <div className="space-y-6 animate-slide-down">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#A97FFF]" />
                  Ödeme Yöntemi
                </h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === 'card'
                        ? 'border-[#A97FFF] bg-[#A97FFF]/10'
                        : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1A1A22] hover:border-[#A97FFF]/50'
                    }`}
                  >
                    <CreditCard className="w-6 h-6 text-gray-800 dark:text-white mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-800 dark:text-white">Kredi Kartı</p>
                  </button>
                  
                  <button
                    onClick={() => setPaymentMethod('paypal')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === 'paypal'
                        ? 'border-[#A97FFF] bg-[#A97FFF]/10'
                        : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1A1A22] hover:border-[#A97FFF]/50'
                    }`}
                  >
                    <div className="w-6 h-6 mx-auto mb-2 font-bold text-gray-800 dark:text-white">PP</div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">PayPal</p>
                  </button>
                  
                  <button
                    onClick={() => setPaymentMethod('crypto')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === 'crypto'
                        ? 'border-[#A97FFF] bg-[#A97FFF]/10'
                        : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1A1A22] hover:border-[#A97FFF]/50'
                    }`}
                  >
                    <div className="w-6 h-6 mx-auto mb-2 font-bold text-gray-800 dark:text-white">₿</div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">Crypto</p>
                  </button>
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-gradient-to-br from-[#1A1A22] to-[#242430] from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Sipariş Özeti</h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Paket Tutarı</span>
                    <span className="text-gray-800 dark:text-white font-medium">${selectedPkg?.amount}</span>
                  </div>
                  
                  {selectedPkg && selectedPkg.bonus > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span className="flex items-center gap-1">
                        <Gift className="w-4 h-4" />
                        Bonus
                      </span>
                      <span className="font-medium">+${selectedPkg.bonus}</span>
                    </div>
                  )}
                  
                  <div className="h-px bg-gray-200 dark:bg-gray-800"></div>
                  
                  <div className="flex justify-between text-gray-800 dark:text-white text-lg font-bold">
                    <span>Toplam Kredi</span>
                    <span className="text-[#A97FFF]">${selectedPkg && (selectedPkg.amount + selectedPkg.bonus)}</span>
                  </div>
                  
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Ödenecek Tutar</span>
                    <span className="text-gray-800 dark:text-white font-semibold text-xl">${selectedPkg?.price}</span>
                  </div>
                </div>

                <button
                  onClick={handlePurchase}
                  className="w-full mt-6 py-4 bg-gradient-to-r from-[#A97FFF] to-[#7C5DFF] hover:from-[#B88FFF] hover:to-[#8C6DFF] text-white rounded-xl font-bold transition-all shadow-lg shadow-[#A97FFF]/30 flex items-center justify-center gap-2 text-lg"
                >
                  <Wallet className="w-6 h-6" />
                  Ödemeyi Tamamla
                </button>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 bg-[#1A1A22]/50 bg-gray-50 rounded-xl">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Check className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-gray-800 dark:text-white font-medium text-sm">Güvenli Ödeme</p>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">256-bit SSL</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-[#1A1A22]/50 bg-gray-50 rounded-xl">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Zap className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-gray-800 dark:text-white font-medium text-sm">Anında Yükleme</p>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">Hemen kullan</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-[#1A1A22]/50 bg-gray-50 rounded-xl">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Crown className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-gray-800 dark:text-white font-medium text-sm">Premium Destek</p>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">7/24 yardım</p>
                  </div>
                </div>
              </div>

              {/* Promotional Banner */}
              <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center gap-4">
                <div className="p-3 bg-yellow-500/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-yellow-400 font-semibold">İlk Alışverişe %20 Bonus!</p>
                  <p className="text-gray-400 text-sm">Şimdi satın alın, daha fazla kazanın</p>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!selectedPackage && (
            <div className="text-center py-12">
              <div className="inline-flex p-4 bg-gray-100 dark:bg-[#1A1A22] rounded-2xl mb-4">
                <Star className="w-12 h-12 text-[#A97FFF]" />
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Başlamak için yukarıdan bir paket seçin
              </p>
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
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}





