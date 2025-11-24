import React, { useState, useEffect } from 'react';
import { Word, UserSettings, AppStats, ViewState, AuthUser } from './types';
import { StorageService } from './services/storageService';
import { AuthView } from './components/AuthView';
import { HomeView } from './components/HomeView';
import { StudyView } from './components/StudyView';
import { LibraryView } from './components/LibraryView';
import { StatsView } from './components/StatsView';
import { ProfileView } from './components/ProfileView';
import { Layout } from './components/Layout';

const App: React.FC = () => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [view, setView] = useState<ViewState>('home');
  
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [stats, setStats] = useState<AppStats | null>(null);
  const [vocab, setVocab] = useState<Word[]>([]);
  
  const [studyQueue, setStudyQueue] = useState<Word[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Initialize DB on mount
  useEffect(() => {
    StorageService.initAuthDB();
  }, []);

  // Load User Data when AuthUser changes
  useEffect(() => {
    if (authUser) {
      setIsLoadingData(true);
      const data = StorageService.loadUserData(authUser.username, authUser.isAdmin);
      setUserSettings(data.user);
      setStats(data.stats);
      setVocab(data.vocab);
      setIsLoadingData(false);
      setView('home');
    }
  }, [authUser]);

  // Persist data whenever state changes
  useEffect(() => {
    if (authUser && userSettings && stats && vocab) {
      StorageService.saveUserData(authUser.username, {
        user: userSettings,
        stats: stats,
        vocab: vocab
      });
    }
  }, [userSettings, stats, vocab, authUser]);

  const handleLogout = () => {
    setAuthUser(null);
    setUserSettings(null);
    setStats(null);
    setVocab([]);
  };

  const startSession = (customList?: Word[]) => {
    if (!userSettings || !stats) return;

    let queue: Word[] = [];
    
    if (customList && customList.length > 0) {
      queue = customList;
    } else {
      // 1. Filter by Category first
      const category = userSettings.selectedCategory || '全部单词';
      let activeVocab = vocab;
      if (category !== '全部单词') {
        activeVocab = vocab.filter(w => w.category === category);
      }

      // 2. Filter by Due/New
      const now = Date.now();
      const due = activeVocab.filter(w => w.srs.nextReview <= now && w.srs.reps > 0);
      
      const limit = userSettings.dailyGoal - stats.todayLearned;
      const newCards = activeVocab.filter(w => w.srs.reps === 0);
      const toTake = Math.max(0, limit);
      
      const shuffledNew = newCards.sort(() => Math.random() - 0.5).slice(0, toTake);
      
      queue = [...due, ...shuffledNew];
    }

    if (queue.length === 0) {
      alert(`🎉 当前 "${userSettings.selectedCategory}" 分类下没有待学习的单词！\n请增加每日计划或切换其他分类。`);
      return;
    }

    setStudyQueue(queue);
    setView('study');
  };

  if (!authUser) {
    return <AuthView onLogin={setAuthUser} />;
  }

  if (isLoadingData || !userSettings || !stats) {
    return <div className="h-screen w-screen flex items-center justify-center bg-blue-50 text-blue-600">Loading data...</div>;
  }

  return (
    <Layout 
      currentView={view} 
      onChangeView={setView} 
      user={userSettings} 
      authUser={authUser}
      onLogout={handleLogout}
    >
      {view === 'home' && (
        <HomeView 
          user={userSettings} 
          stats={stats} 
          vocab={vocab} 
          onStartStudy={() => startSession()} 
          onNavigate={setView}
          onUpdateUser={setUserSettings}
        />
      )}
      {view === 'study' && (
        <StudyView 
          queue={studyQueue}
          onComplete={(updatedWords, newStats) => {
             const newVocab = vocab.map(w => {
               const updated = updatedWords.find(u => u.id === w.id);
               return updated || w;
             });
             setVocab(newVocab);
             setStats({
               ...stats,
               todayLearned: stats.todayLearned + newStats.learned,
               totalMastered: stats.totalMastered + newStats.mastered
             });
          }}
          onExit={() => setView('home')}
        />
      )}
      {view === 'library' && (
        <LibraryView 
          vocab={vocab} 
          authUser={authUser}
          onUpdateVocab={(newVocab, addedWords) => {
            setVocab(newVocab);
            // If admin added words, sync to global
            if (authUser.isAdmin && addedWords && addedWords.length > 0) {
              const count = StorageService.addToGlobalLibrary(addedWords);
              if (count > 0) alert(`管理员操作：已同步 ${count} 个新单词到公共词库。`);
            }
          }}
          onStartSession={startSession}
        />
      )}
      {view === 'stats' && (
        <StatsView stats={stats} vocab={vocab} />
      )}
      {view === 'profile' && (
        <ProfileView 
          user={userSettings} 
          onUpdateUser={setUserSettings} 
          onClearData={() => {
            if(confirm("⚠️ 确定要清空您的所有数据吗？\n这将重置您的学习进度。")) {
              StorageService.clearUserData(authUser.username);
              window.location.reload();
            }
          }}
        />
      )}
    </Layout>
  );
};

export default App;