import React from 'react';
import { ViewState, UserSettings, AuthUser } from '../types';
import { Home, Book, BarChart2, User, HeartPulse, LogOut, ShieldCheck } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  user: UserSettings;
  authUser: AuthUser;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onChangeView, user, authUser, onLogout }) => {
  if (currentView === 'study') {
    return <div className="h-full w-full bg-slate-50">{children}</div>;
  }

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState; icon: any; label: string }) => {
    const isActive = currentView === view;
    return (
      <button 
        onClick={() => onChangeView(view)}
        className={`flex flex-col items-center justify-center w-16 transition-colors duration-200 ${isActive ? 'text-blue-600 font-bold' : 'text-slate-500 font-medium'}`}
      >
        <div className={`w-16 h-8 rounded-full flex items-center justify-center mb-1 transition-colors ${isActive ? 'bg-blue-100' : 'bg-transparent'}`}>
          <Icon size={20} />
        </div>
        <span className="text-[10px]">{label}</span>
      </button>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 max-w-md mx-auto shadow-2xl overflow-hidden relative">
      {/* App Bar */}
      <div className="h-16 px-4 bg-white flex items-center justify-between border-b border-slate-100 z-10 shrink-0">
        <div className="flex items-center gap-2">
           <HeartPulse className="text-blue-600" size={24} />
           <div>
             <span className="text-lg font-bold text-slate-800 tracking-tight block leading-none">萁萁的随身单词本</span>
             {authUser.isAdmin && (
               <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded flex items-center gap-1 w-fit mt-1">
                 <ShieldCheck size={10} /> 管理员模式
               </span>
             )}
           </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onLogout}
            className="text-slate-400 hover:text-slate-600 p-2"
            title="退出登录"
          >
            <LogOut size={20} />
          </button>
          <button onClick={() => onChangeView('profile')} className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border border-blue-200">
            {user.avatarType === 'image' ? (
              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg">{user.avatar}</span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
        {children}
      </div>

      {/* Bottom Nav */}
      <nav className="h-20 bg-white border-t border-slate-200 flex justify-around items-center pb-2 z-10 shrink-0">
        <NavItem view="home" icon={Home} label="主页" />
        <NavItem view="library" icon={Book} label="词库" />
        <NavItem view="stats" icon={BarChart2} label="统计" />
        <NavItem view="profile" icon={User} label="我的" />
      </nav>
    </div>
  );
};