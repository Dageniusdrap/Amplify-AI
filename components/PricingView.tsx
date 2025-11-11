import React, { useState } from 'react';
import { CheckIcon } from './icons/CheckIcon';
import type { User } from '../types';

interface PricingViewProps {
  currentPlan: User['plan'];
  onApplyPromoCode: (code: string) => void;
}

const tiers = [
  {
    name: 'Free',
    price: '$0',
    description: 'For individuals starting out with content analysis and creation.',
    features: [
      '5 AI Generations per month',
      'Basic Sales Call Analysis',
      'Standard Content Generation',
      'Community Support',
    ],
  },
  {
    name: 'Creator',
    price: '$3',
    description: 'For professionals and small teams who need more power.',
    features: [
      '100 AI Generations per month',
      'Advanced Analysis & Feedback',
      'Image & 720p Video Generation',
      'Brand Voice Customization',
      'Email Support',
    ],
  },
  {
    name: 'Pro',
    price: '$20',
    description: 'For large organizations with advanced needs and support.',
    features: [
      'Unlimited AI Generations',
      'Team Collaboration Tools',
      '1080p Video & API Access',
      'Dedicated Account Manager',
      '24/7 Priority Support',
    ],
  },
];

export const PricingView: React.FC<PricingViewProps> = ({ currentPlan, onApplyPromoCode }) => {
  const [promoCode, setPromoCode] = useState('');

  const handleApply = () => {
    if (promoCode.trim()) {
        onApplyPromoCode(promoCode);
        setPromoCode('');
    }
  };

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            Flexible plans for everyone
          </h2>
          <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
            Choose a plan that works for you. All plans come with our core content intelligence features.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl shadow-lg border p-8 flex flex-col ${
                tier.name === currentPlan 
                ? 'bg-white dark:bg-gray-800 border-indigo-500 ring-2 ring-indigo-500' 
                : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
              }`}
            >
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">{tier.name}</h3>
              <p className="mt-4 text-gray-500 dark:text-gray-400 flex-grow">{tier.description}</p>
              <div className="mt-6">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{tier.price}</span>
                {tier.name !== 'Custom' && <span className="text-base font-medium text-gray-500 dark:text-gray-400">/mo</span>}
              </div>

              <ul className="mt-8 space-y-4">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckIcon className="h-6 w-6 text-green-500" aria-hidden="true" />
                    </div>
                    <p className="ml-3 text-base text-gray-700 dark:text-gray-300">{feature}</p>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-8">
                <button
                  className={`w-full px-6 py-3 text-base font-medium rounded-md shadow-sm ${
                    tier.name === currentPlan
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 cursor-default'
                      : tier.name === 'Pro' 
                      ? 'text-white bg-indigo-600 hover:bg-indigo-700' 
                      : 'text-indigo-700 bg-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900'
                  }`}
                  disabled={tier.name === currentPlan}
                >
                  {tier.name === currentPlan ? 'Current Plan' : `Upgrade to ${tier.name}`}
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center max-w-md mx-auto">
            <h4 className="text-lg font-semibold">Have a promo code?</h4>
            <div className="mt-2 flex gap-2">
                <input 
                    type="text" 
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="e.g., PROTRIAL"
                    className="flex-grow px-3 py-2 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-md"
                />
                <button onClick={handleApply} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Apply</button>
            </div>
        </div>
      </div>
    </div>
  );
};
