import React, { useState } from 'react';
import { StorageService } from '../services/storageService';
import { AuthUser } from '../types';
import { LogIn, UserPlus, HeartPulse } from 'lucide-react';

interface AuthViewProps {
  onLogin: (user: AuthUser) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }

    if (isLogin) {
      const result = StorageService.login(username, password);
      if (result.success && result.user) {
        onLogin(result.user);
      } else {
        setError(result.message || '登录失败');
      }
    } else {
      const result = StorageService.register(username, password);
      if (result.success) {
        alert('注册成功，请登录');
        setIsLogin(true);
      } else {
        setError(result.message);
      }
    }
  };

  return (
    <div className="h-screen w-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl overflow-hidden">
        <div className="bg-blue-600 p-8 flex flex-col items-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
            <HeartPulse className="text-blue-600" size={32} />
          </div>
          <h1 className="text-white text-2xl font-bold">萁萁的随身单词本</h1>
          <p className="text-blue-200 text-sm mt-1">专为萁萁打造</p>
        </div>

        <div className="p-8">
          <div className="flex gap-4 mb-6">
            <button 
              className={`flex-1 py-2 text-center text-sm font-bold border-b-2 transition-colors ${isLogin ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}
              onClick={() => { setIsLogin(true); setError(''); }}
            >
              登录
            </button>
            <button 
              className={`flex-1 py-2 text-center text-sm font-bold border-b-2 transition-colors ${!isLogin ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}
              onClick={() => { setIsLogin(false); setError(''); }}
            >
              注册
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 ml-1">用户名</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mt-1 focus:outline-none focus:border-blue-600 transition-colors"
                placeholder={isLogin ? "请输入用户名" : "设置用户名"}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 ml-1">密码</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mt-1 focus:outline-none focus:border-blue-600 transition-colors"
                placeholder={isLogin ? "请输入密码" : "设置密码"}
              />
            </div>

            {error && <div className="text-red-500 text-xs text-center">{error}</div>}

            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
            >
              {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
              {isLogin ? '进入应用' : '立即注册'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};