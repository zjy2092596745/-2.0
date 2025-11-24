import { Word, UserSettings, AppStats, AuthUser } from '../types';
import * as XLSX from 'xlsx';

const GLOBAL_KEYS = {
  USERS_DB: 'nurse_users_db',
  GLOBAL_VOCAB: 'nurse_global_vocab',
};

const getUserKey = (username: string) => `nurse_data_${username}`;

// Initial Data Defaults
const DEFAULT_USER_SETTINGS: UserSettings = {
  nickname: "新用户",
  avatar: "👩‍⚕️",
  avatarType: "text",
  dailyGoal: 20,
  selectedCategory: "全部单词" // Default book
};

const DEFAULT_STATS: AppStats = {
  lastLogin: null,
  todayLearned: 0,
  totalMastered: 0
};

const SEED_DATA: Word[] = [
  { id: 1, word: "Patient", ipa: "/ˈpeɪʃnt/", def: "病人", ex_en: "The nurse checked the patient.", ex_cn: "护士检查了病人。", category: "护理英语", srs: { interval: 0, reps: 0, ease: 2.5, nextReview: 0 } },
  { id: 2, word: "Nurse", ipa: "/nɜːs/", def: "护士", ex_en: "The nurse monitors vital signs.", ex_cn: "护士监测生命体征。", category: "护理英语", srs: { interval: 0, reps: 0, ease: 2.5, nextReview: 0 } },
  { id: 3, word: "Pulse", ipa: "/pʌls/", def: "脉搏", ex_en: "Check the radial pulse.", ex_cn: "检查桡动脉脉搏。", category: "护理英语", srs: { interval: 0, reps: 0, ease: 2.5, nextReview: 0 } },
  { id: 4, word: "Vein", ipa: "/veɪn/", def: "静脉", ex_en: "Insert needle into the vein.", ex_cn: "将针头插入静脉。", category: "护理英语", srs: { interval: 0, reps: 0, ease: 2.5, nextReview: 0 } },
  { id: 5, word: "Fever", ipa: "/ˈfiːvə/", def: "发烧", ex_en: "The child has a high fever.", ex_cn: "孩子发高烧。", category: "护理英语", srs: { interval: 0, reps: 0, ease: 2.5, nextReview: 0 } },
  { id: 6, word: "Describe", ipa: "/dɪˈskraɪb/", def: "描述", ex_en: "Describe image below.", ex_cn: "描述下图。", category: "PTE", srs: { interval: 0, reps: 0, ease: 2.5, nextReview: 0 } },
  { id: 7, word: "Retell", ipa: "/ˌriːˈtel/", def: "复述", ex_en: "Retell the lecture.", ex_cn: "复述讲座内容。", category: "PTE", srs: { interval: 0, reps: 0, ease: 2.5, nextReview: 0 } }
];

export const StorageService = {
  // --- AUTHENTICATION ---

  initAuthDB: () => {
    const dbRaw = localStorage.getItem(GLOBAL_KEYS.USERS_DB);
    if (!dbRaw) {
      // Create Admin account by default
      const initialDB: AuthUser[] = [
        { username: 'admin', password: 'admin888', isAdmin: true }
      ];
      localStorage.setItem(GLOBAL_KEYS.USERS_DB, JSON.stringify(initialDB));
      
      // Seed global vocab
      if (!localStorage.getItem(GLOBAL_KEYS.GLOBAL_VOCAB)) {
        localStorage.setItem(GLOBAL_KEYS.GLOBAL_VOCAB, JSON.stringify(SEED_DATA));
      }
    }
  },

  register: (username: string, password: string): { success: boolean, message: string } => {
    const db: AuthUser[] = JSON.parse(localStorage.getItem(GLOBAL_KEYS.USERS_DB) || '[]');
    if (db.find(u => u.username === username)) {
      return { success: false, message: '用户名已存在' };
    }
    const newUser: AuthUser = { username, password, isAdmin: false };
    db.push(newUser);
    localStorage.setItem(GLOBAL_KEYS.USERS_DB, JSON.stringify(db));
    return { success: true, message: '注册成功' };
  },

  login: (username: string, password: string): { success: boolean, user?: AuthUser, message?: string } => {
    const db: AuthUser[] = JSON.parse(localStorage.getItem(GLOBAL_KEYS.USERS_DB) || '[]');
    const user = db.find(u => u.username === username && u.password === password);
    if (user) {
      return { success: true, user };
    }
    return { success: false, message: '用户名或密码错误' };
  },

  // --- DATA MANAGEMENT ---

  loadUserData: (username: string, isAdmin: boolean) => {
    const key = getUserKey(username);
    const rawData = localStorage.getItem(key);
    
    let data: { user: UserSettings, stats: AppStats, vocab: Word[] };

    if (rawData) {
      data = JSON.parse(rawData);
      // Backwards compatibility for missing category field
      if (!data.user.selectedCategory) data.user.selectedCategory = "全部单词";
      data.vocab.forEach(w => {
        if (!w.category) w.category = "未分类";
      });
    } else {
      // New user init
      data = {
        user: { ...DEFAULT_USER_SETTINGS, nickname: username },
        stats: { ...DEFAULT_STATS },
        vocab: [] // Will sync from global
      };
    }

    // Sync Global Vocab for everyone
    const globalVocabRaw = localStorage.getItem(GLOBAL_KEYS.GLOBAL_VOCAB);
    const globalVocab: Word[] = globalVocabRaw ? JSON.parse(globalVocabRaw) : SEED_DATA;

    // Merge logic: Add words from global that don't exist in user vocab (by word spelling)
    const userWordSet = new Set(data.vocab.map(w => w.word.toLowerCase().trim()));
    let newWordsAdded = 0;

    globalVocab.forEach(gw => {
      if (!userWordSet.has(gw.word.toLowerCase().trim())) {
        // Create a personalized copy of the global word
        data.vocab.push({
          ...gw,
          id: Date.now() + Math.random(), // New ID to avoid collision
          srs: { interval: 0, reps: 0, ease: 2.5, nextReview: 0 } // Reset SRS for this user
        });
        newWordsAdded++;
      }
    });

    if (newWordsAdded > 0) {
      localStorage.setItem(key, JSON.stringify(data));
    }

    // Check midnight reset
    const today = new Date().toDateString();
    if (data.stats.lastLogin !== today) {
      data.stats.lastLogin = today;
      data.stats.todayLearned = 0;
      localStorage.setItem(key, JSON.stringify(data));
    }

    return data;
  },

  saveUserData: (username: string, data: { user: UserSettings, stats: AppStats, vocab: Word[] }) => {
    localStorage.setItem(getUserKey(username), JSON.stringify(data));
  },

  // Called by Admin only
  addToGlobalLibrary: (newWords: Word[]) => {
    const raw = localStorage.getItem(GLOBAL_KEYS.GLOBAL_VOCAB);
    let global: Word[] = raw ? JSON.parse(raw) : [];
    
    const existing = new Set(global.map(w => w.word.toLowerCase().trim()));
    let count = 0;

    newWords.forEach(w => {
      if (!existing.has(w.word.toLowerCase().trim())) {
        global.push(w);
        count++;
      }
    });

    if (count > 0) {
      localStorage.setItem(GLOBAL_KEYS.GLOBAL_VOCAB, JSON.stringify(global));
    }
    return count;
  },

  clearUserData: (username: string) => {
    localStorage.removeItem(getUserKey(username));
  },

  // SRS Logic
  processRating: (word: Word, quality: number): { updatedWord: Word, isLearnedToday: boolean, isMastered: boolean } => {
    const srs = { ...word.srs };
    const wasMastered = word.srs.interval >= 21;
    let isLearnedToday = false;
    let isMastered = false;

    if (quality === 0) {
      srs.reps = 0;
      srs.interval = 0;
      srs.nextReview = Date.now() + (1 * 60 * 1000); // 1 min
    } else {
      if (srs.reps === 0) srs.interval = 1;
      else if (srs.reps === 1) srs.interval = 3;
      else srs.interval = Math.ceil(srs.interval * srs.ease);

      srs.reps++;
      if (quality === 1) srs.ease = Math.max(1.3, srs.ease - 0.2);
      if (quality === 3) srs.ease += 0.15;
      
      srs.nextReview = Date.now() + (srs.interval * 24 * 60 * 60 * 1000);

      if (srs.reps === 1) isLearnedToday = true;

      // Only count mastery when the card crosses the 21-day threshold
      // for the first time to avoid double-counting already mastered words.
      if (!wasMastered && srs.interval >= 21) {
        isMastered = true;
      }
    }

    return { updatedWord: { ...word, srs }, isLearnedToday, isMastered };
  },

  importFile: async (file: File, defaultCategory: string = "导入单词"): Promise<Word[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          let newWords: any[] = [];

          if (file.name.endsWith('.json')) {
             newWords = JSON.parse(data as string);
             if (!Array.isArray(newWords)) newWords = [newWords];
          } else {
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            newWords = XLSX.utils.sheet_to_json(sheet);
          }

          const normalized: Word[] = newWords.map((item: any) => {
            const word = item.word || item.Word || item.WORD || item['单词'] || item['Term'] || item['英文'];
            const def = item.definition_cn || item.definition || item.Definition || item.meaning || item['释义'] || item['中文'];
            
            if (!word || !def) return null;

            return {
              id: Date.now() + Math.random(),
              word: String(word).trim(),
              ipa: item.ipa || item.IPA || item['音标'] || '',
              def: String(def).trim(),
              ex_en: item.example_en || item.example || item.Example || item['例句'] || '',
              ex_cn: item.example_cn || item.translation || item['例句翻译'] || '',
              // Default to 'defaultCategory' if category column missing
              category: item.category || item.Category || item['分类'] || item['书名'] || defaultCategory, 
              srs: { interval: 0, reps: 0, ease: 2.5, nextReview: 0 }
            };
          }).filter((w): w is Word => w !== null);

          resolve(normalized);
        } catch (err) {
          reject(err);
        }
      };

      if (file.name.endsWith('.json')) {
        reader.readAsText(file);
      } else {
        reader.readAsBinaryString(file);
      }
    });
  }
};