import React, { useState } from 'react';
import { MailIcon } from './icons/MailIcon';
import { KeyIcon } from './icons/KeyIcon';
import { Loader } from './Loader';
import type { User } from '../types';

interface ActivationViewProps {
  user: User;
  onActivationSuccess: (user: User) => void;
}

type ActivationStep = 'info' | 'input';

export const ActivationView: React.FC<ActivationViewProps> = ({ user, onActivationSuccess }) => {
  const [step, setStep] = useState<ActivationStep>('info');
  const [activationCode, setActivationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (activationCode.toUpperCase() !== 'PROTRIAL') {
      setError('Invalid activation code. Please try again.');
      return;
    }
    
    setIsLoading(true);
    setTimeout(() => {
        setIsLoading(false);
        onActivationSuccess(user);
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] py-12">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 text-center">
        {isLoading ? (
            <Loader message="Activating your account..." />
        ) : step === 'info' ? (
             <div>
                <MailIcon className="w-12 h-12 mx-auto text-indigo-500" />
                <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
                    Check Your Email
                </h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    We've sent an activation code to <span className="font-semibold">{user.email}</span>. Please enter it on the next screen.
                </p>
                 <button onClick={() => setStep('input')} className="mt-6 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                    I have my code
                </button>
            </div>
        ) : (
            <>
                <div>
                    <KeyIcon className="w-12 h-12 mx-auto text-indigo-500" />
                    <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
                        Activate Your Account
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                       Enter the code sent to your email to get started. (Hint: try PROTRIAL)
                    </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <input id="activation-code" name="activation-code" type="text" value={activationCode} onChange={(e) => setActivationCode(e.target.value.toUpperCase())} maxLength={10} required className="block w-full px-3 py-2 text-center tracking-[0.2em] font-mono bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-md" placeholder="CODE" />
                    </div>
                     {error && <p className="text-sm text-red-600">{error}</p>}
                    <div>
                        <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                            Activate & Continue
                        </button>
                    </div>
                </form>
            </>
        )}
      </div>
    </div>
  );
};
