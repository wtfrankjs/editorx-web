import { X, Check, Zap, Crown, Rocket, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface MembershipPlansProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (planId: string, credits: number) => void;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  credits: number;
  icon: React.ReactNode;
  color: string;
  features: string[];
  popular?: boolean;
  description: string;
}

export default function MembershipPlans({ isOpen, onClose, onSelectPlan }: MembershipPlansProps) {
  const { t } = useLanguage();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans: Plan[] = [
    {
      id: 'starter',
      name: t('plans.starter'),
      price: billingCycle === 'monthly' ? 9.99 : 99.99,
      credits: billingCycle === 'monthly' ? 500 : 6500,
      icon: <Zap className="w-8 h-8" />,
      color: 'from-green-400 to-emerald-500',
      description: t('plans.starterDesc'),
      features: [
        t('plans.starter.feature1'),
        t('plans.starter.feature2'),
        t('plans.starter.feature3'),
        t('plans.starter.feature4'),
        t('plans.starter.feature5'),
        t('plans.starter.feature6')
      ]
    },
    {
      id: 'professional',
      name: t('plans.professional'),
      price: billingCycle === 'monthly' ? 29.99 : 299.99,
      credits: billingCycle === 'monthly' ? 2000 : 26000,
      icon: <Crown className="w-8 h-8" />,
      color: 'from-amber-400 to-yellow-500',
      description: t('plans.professionalDesc'),
      popular: true,
      features: [
        t('plans.professional.feature1'),
        t('plans.professional.feature2'),
        t('plans.professional.feature3'),
        t('plans.professional.feature4'),
        t('plans.professional.feature5'),
        t('plans.professional.feature6'),
        t('plans.professional.feature7'),
        t('plans.professional.feature8')
      ]
    },
    {
      id: 'enterprise',
      name: t('plans.enterprise'),
      price: billingCycle === 'monthly' ? 99.99 : 999.99,
      credits: billingCycle === 'monthly' ? 10000 : 130000,
      icon: <Rocket className="w-8 h-8" />,
      color: 'from-purple-400 to-indigo-500',
      description: t('plans.enterpriseDesc'),
      features: [
        t('plans.enterprise.feature1'),
        t('plans.enterprise.feature2'),
        t('plans.enterprise.feature3'),
        t('plans.enterprise.feature4'),
        t('plans.enterprise.feature5'),
        t('plans.enterprise.feature6'),
        t('plans.enterprise.feature7'),
        t('plans.enterprise.feature8'),
        t('plans.enterprise.feature9')
      ]
    }
  ];

  const handleSelectPlan = () => {
    if (!selectedPlan) return;
    const plan = plans.find(p => p.id === selectedPlan);
    if (plan) {
      onSelectPlan(plan.id, plan.credits);
      onClose();
    }
  };

  if (!isOpen) return null;

  const discount = 20; // Always show discount to encourage yearly subscription

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-black rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col border border-amber-500/30 dark:border-amber-500/20 animate-scale-in relative">
        {/* Header with Close Button */}
        <div className="relative bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-500/20 dark:via-yellow-500/20 dark:to-amber-500/20 p-8 border-b border-amber-200 dark:border-amber-500/20 rounded-t-3xl flex-shrink-0">
          {/* Close Button - Absolute Top Right */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition-all z-50 bg-white/80 dark:bg-black/50 backdrop-blur-sm"
          >
            <X className="w-6 h-6 text-gray-800 dark:text-white" />
          </button>
          
          <div className="text-center mb-6">
            <div className="inline-flex p-3 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {t('plans.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              {t('plans.subtitle')}
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center">
            <div className="inline-flex bg-white dark:bg-black/30 p-1.5 rounded-xl border border-amber-500/30">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {t('plans.monthly')}
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2.5 rounded-lg font-semibold transition-all relative ${
                  billingCycle === 'yearly'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {t('plans.yearly')}
                {discount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
                    %{discount} {t('plans.discount')}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Plans Grid - Scrollable */}
        <div className="p-8 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                  selectedPlan === plan.id
                    ? 'border-amber-500 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 shadow-xl shadow-amber-500/20 scale-105'
                    : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:border-amber-500/50 hover:scale-102'
                } ${plan.popular ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-900' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-sm font-bold shadow-lg whitespace-nowrap" style={{ borderRadius: '9999px' }}>
                    🌟 {t('plans.popular')}
                  </div>
                )}

                {/* Icon */}
                <div className={`inline-flex p-3 bg-gradient-to-r ${plan.color} rounded-xl mb-4 text-white`}>
                  {plan.icon}
                </div>

                {/* Plan Info */}
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {plan.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {plan.description}
                </p>

                {/* Pricing */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      ${plan.price}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      /{billingCycle === 'monthly' ? t('plans.monthly') : t('plans.yearly')}
                    </span>
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 rounded-full">
                    <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    <span className="text-amber-500 dark:text-amber-400 font-bold text-sm">
                      {plan.credits.toLocaleString()} {t('plans.credits')}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="w-5 h-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Select Indicator */}
                {selectedPlan === plan.id && (
                  <div className="absolute top-4 right-4">
                    <div className="p-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Action Button */}
          <div className="mt-8 text-center">
            <button
              onClick={handleSelectPlan}
              disabled={!selectedPlan}
              className="px-12 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-amber-500/30 disabled:shadow-none"
            >
              {selectedPlan ? t('plans.continue') : t('plans.select')}
            </button>
            
            <p className="text-gray-600 dark:text-gray-500 text-sm mt-4">
              🔒 {t('plans.secure')} • 💳 {t('plans.cards')} • 🔄 {t('plans.cancel')}
            </p>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="p-4 bg-white dark:bg-gray-800/50 bg-gray-100 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="text-2xl mb-2">⚡</div>
              <p className="text-gray-900 dark:text-white font-semibold mb-1">{t('notifications.instantActivation')}</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{t('notifications.useAfterPayment')}</p>
            </div>
            <div className="p-4 bg-white dark:bg-gray-800/50 bg-gray-100 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="text-2xl mb-2">🔄</div>
              <p className="text-gray-900 dark:text-white font-semibold mb-1">{t('plans.cancel')}</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{t('plans.cancel')}</p>
            </div>
            <div className="p-4 bg-white dark:bg-gray-800/50 bg-gray-100 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="text-2xl mb-2">📞</div>
              <p className="text-gray-900 dark:text-white font-semibold mb-1">{t('plans.support') || '7/24 Destek'}</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{t('plans.supportDesc') || 'Her zaman yanınızdayız'}</p>
            </div>
          </div>
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
        .scale-102 {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
}






