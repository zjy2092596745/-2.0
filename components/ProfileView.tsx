import React, { useRef } from 'react';
import { UserSettings } from '../types';
import { Camera, Trash2, Save } from 'lucide-react';

interface ProfileViewProps {
  user: UserSettings;
  onUpdateUser: (user: UserSettings) => void;
  onClearData: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onUpdateUser, onClearData }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image too large (< 2MB)");
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        onUpdateUser({ ...user, avatar: ev.target?.result as string, avatarType: 'image' });
      };
      reader.readAsDataURL(file);
    }
  };

  const PRESETS = ['👩‍⚕️', '👨‍⚕️', '🏥', '💊', '💉', '🩺', '🧠', '👧'];

  return (
    <div className="p-4 space-y-6 pb-24">
      <h2 className="text-xl font-bold text-slate-800">个人中心</h2>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center overflow-hidden border border-blue-100">
             {user.avatarType === 'image' ? (
                <img src={user.avatar} className="w-full h-full object-cover" />
             ) : (
                <span className="text-3xl">{user.avatar}</span>
             )}
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1.5 rounded-full shadow-sm"
          >
            <Camera size={12} />
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
        </div>
        <div className="flex-1">
          <label className="text-xs text-blue-600 font-bold">昵称</label>
          <input 
            type="text" 
            value={user.nickname} 
            onChange={(e) => onUpdateUser({...user, nickname: e.target.value})}
            className="w-full text-lg font-bold text-slate-800 border-b border-dashed border-slate-300 focus:border-blue-600 outline-none bg-transparent"
          />
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
         <h3 className="text-sm font-bold text-slate-700 mb-3">选择头像</h3>
         <div className="flex flex-wrap gap-3">
           {PRESETS.map(p => (
             <button 
               key={p} 
               onClick={() => onUpdateUser({...user, avatar: p, avatarType: 'text'})}
               className="w-10 h-10 bg-slate-50 hover:bg-blue-50 rounded-full flex items-center justify-center text-xl transition-colors"
             >
               {p}
             </button>
           ))}
         </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex justify-between mb-2">
          <span className="font-bold text-slate-700">每日新词上限</span>
          <span className="font-bold text-blue-600">{user.dailyGoal}</span>
        </div>
        <input 
          type="range" 
          min="5" 
          max="100" 
          step="5" 
          value={user.dailyGoal} 
          onChange={(e) => onUpdateUser({...user, dailyGoal: parseInt(e.target.value)})}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <p className="text-xs text-slate-400 mt-2">每天计划学习的新单词数量。</p>
      </div>

      <button 
        onClick={onClearData}
        className="w-full py-3 mt-4 border border-red-200 text-red-500 rounded-xl flex items-center justify-center gap-2 font-medium hover:bg-red-50"
      >
        <Trash2 size={18} />
        清空所有数据
      </button>
      
      <div className="text-center text-xs text-slate-300 pt-4">
        QiQi's Portable Vocabulary Book v2.5<br/>
        Made for QiQi with ❤️
      </div>
    </div>
  );
};