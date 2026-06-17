import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  ShieldAlert, 
  Layers
} from 'lucide-react';

export const LoginRegister: React.FC = () => {
  const { login, register, setView, isLoading } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'customer' | 'agent' | 'admin'>('customer');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password.trim() || (!isLogin && !name.trim())) {
      setErrorMsg('Please populate all required fields correctly.');
      return;
    }

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password, role);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'API processing failed, check server logs.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12 font-sans dark:bg-[#090d16]">
      {/* Absolute Header Logo redirection */}
      <button 
        onClick={() => setView('landing')}
        className="absolute top-6 left-6 flex items-center gap-2"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500 text-white">
          <Layers className="h-4 w-4" />
        </div>
        <span className="font-bold text-sm tracking-tight text-gray-800 dark:text-slate-300">
          Intercomly
        </span>
      </button>

      {/* Main card panel */}
      <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-xl dark:border-[#1e293b] dark:bg-[#0f172a]">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-black text-gray-950 dark:text-white">
            {isLogin ? 'Welcome Back' : 'Join Support System'}
          </h2>
          <p className="text-xs text-gray-500 mt-1 dark:text-slate-400">
            {isLogin ? 'Sign in to access real-time channels' : 'Register a new customer or agent profile'}
          </p>
        </div>

        {/* Tab Selection */}
        <div className="mb-6 flex rounded-xl bg-gray-100 p-1 dark:bg-slate-900">
          <button
            onClick={() => { setIsLogin(true); setErrorMsg(''); }}
            className={`flex-1 rounded-lg py-2.5 text-xs font-semibold transition ${
              isLogin 
                ? 'bg-white text-gray-900 shadow dark:bg-slate-800 dark:text-white' 
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Sign In Account
          </button>
          <button
            onClick={() => { setIsLogin(false); setErrorMsg(''); }}
            className={`flex-1 rounded-lg py-2.5 text-xs font-semibold transition ${
              !isLogin 
                ? 'bg-white text-gray-900 shadow dark:bg-slate-800 dark:text-white' 
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Create Sandbox
          </button>
        </div>

        {/* Dynamic Alerts */}
        {errorMsg && (
          <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 dark:border-red-950/20 dark:bg-red-950/10 dark:text-red-450">
            <ShieldAlert className="h-4 w-4" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Core Auth Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-slate-300">
                Full Display Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sarah Jenkins"
                  className="w-full rounded-xl border border-gray-250 bg-white py-2.5 pl-10 pr-4 text-xs text-gray-900 outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-slate-300">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                className="w-full rounded-xl border border-gray-250 bg-white py-2.5 pl-10 pr-4 text-xs text-gray-900 outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-slate-300">
              Secure Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-gray-250 bg-white py-2.5 pl-10 pr-4 text-xs text-gray-900 outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-slate-300">
                Register System Assignment Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['customer', 'agent', 'admin'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`rounded-lg py-2 text-xs font-bold capitalize transition border ${
                      role === r 
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-400 dark:text-indigo-400' 
                        : 'border-gray-200 hover:bg-gray-50 dark:border-slate-800 dark:hover:bg-slate-900 text-gray-500'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-150 hover:opacity-90 disabled:opacity-50 transition"
          >
            {isLoading ? 'Verifying Credentials...' : 'Authenticate Workspace'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginRegister;
