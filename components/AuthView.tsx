import React, { useState } from 'react';
import { LogoIcon } from './icons/LogoIcon';
import { GoogleIcon } from './icons/GoogleIcon';
import { GithubIcon } from './icons/GithubIcon';
import type { User } from '../types';

interface AuthViewProps {
  onLogin: (user: User) => void;
  onSignup: (user: User) => void;
}

type AuthMode = 'login' | 'signup';

export const AuthView: React.FC<AuthViewProps> = ({ onLogin, onSignup }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSocialLogin = (socialUser: User) => {
    // In a real app, this would trigger an OAuth flow.
    // Here we simulate a successful login.
    onLogin(socialUser);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      // Mock login - in a real app, this would be a server call
      const isOwner = email === 'owner@amplify.ai';
      onLogin({ email, plan: isOwner ? 'Pro' : 'Free', role: isOwner ? 'owner' : 'user', activated: true, name: isOwner ? 'Admin' : 'Test User' });
    } else {
      // Mock signup
      onSignup({ email, name, plan: 'Free', role: 'user' });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] py-12">
      <div className="w-full max-w-sm p-8 space-y-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="text-center">
            <LogoIcon className="w-12 h-12 mx-auto text-indigo-500" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
                {mode === 'login' ? 'Welcome Back' : 'Create Your Account'}
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {mode === 'login' ? 'Sign in to access your dashboard.' : 'Get started with your 30-day free trial.'}
            </p>
        </div>

        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button onClick={() => setMode('login')} className={`w-1/2 py-2 text-sm font-semibold rounded-md ${mode === 'login' ? 'bg-white dark:bg-gray-800 shadow' : ''}`}>Login</button>
            <button onClick={() => setMode('signup')} className={`w-1/2 py-2 text-sm font-semibold rounded-md ${mode === 'signup' ? 'bg-white dark:bg-gray-800 shadow' : ''}`}>Sign Up</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
             {mode === 'signup' && (
                 <div>
                    <label htmlFor="name" className="sr-only">Full Name</label>
                    <input id="name" name="name" type="text" value={name} onChange={e => setName(e.target.value)} required className="block w-full px-3 py-2 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-md" placeholder="Full Name" />
                 </div>
             )}
            <div>
                <label htmlFor="email" className="sr-only">Email address</label>
                <input id="email" name="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="block w-full px-3 py-2 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-md" placeholder="Email address" />
            </div>
             <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <input id="password" name="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="block w-full px-3 py-2 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-md" placeholder="Password" />
            </div>

            <div>
                <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                     {mode === 'login' ? 'Sign In' : 'Create Account'}
                </button>
            </div>
        </form>

         <div className="flex items-center"><div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div><span className="flex-shrink mx-4 text-gray-400 dark:text-gray-500 text-sm">OR</span><div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div></div>
        
        <div className="space-y-4">
            <button onClick={() => handleSocialLogin({ email: 'user@google.com', plan: 'Pro', role: 'user', activated: true, name: 'Google User' })} className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700">
                <GoogleIcon className="w-5 h-5 mr-2" /> Continue with Google
            </button>
             <button onClick={() => handleSocialLogin({ email: 'user@github.com', plan: 'Creator', role: 'user', activated: true, name: 'GitHub User' })} className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700">
                <GithubIcon className="w-5 h-5 mr-2" /> Continue with GitHub
            </button>
        </div>
      </div>
    </div>
  );
};
