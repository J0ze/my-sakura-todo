import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  onSnapshot,
  query
} from 'firebase/firestore';
import { Trash2, Check, Plus, Flower, Cloud, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ---------------------------------------------------------
// 1. Firebase 配置
// ---------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyCQHMnCB9OUDTDRn31z4PljX6oE0h_HwZg",
  authDomain: "sakura-todo-de8a7.firebaseapp.com",
  projectId: "sakura-todo-de8a7",
  storageBucket: "sakura-todo-de8a7.firebasestorage.app",
  messagingSenderId: "660499382018",
  appId: "1:660499382018:web:fd90a2a9e329bae4e5cc1b",
  measurementId: "G-DY7V2JQ4E7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const APP_ID = 'my-shared-todo-v1'; 

// ---------------------------------------------------------
// 2. 子组件 (TodoList)
// ---------------------------------------------------------
const TodoList = ({ 
  items, side, inputValue, setInputValue, title, 
  colorClass, borderColorClass, glowClass, neonBgClass,
  onAdd, onToggle, onDelete, isReady 
}) => (
  <div className={`flex-1 flex flex-col bg-[#0f111a]/90 backdrop-blur-md border ${borderColorClass} shadow-[0_0_15px_rgba(0,0,0,0.4)] h-full max-h-[800px] overflow-hidden relative group rounded-lg`}>
    
    {/* Header */}
    <div className={`p-5 ${colorClass} relative overflow-hidden border-b border-white/5 z-10`}>
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
      <div className="relative z-10 flex flex-col items-center justify-center gap-2">
        <h2 className={`text-2xl font-cyber font-bold tracking-widest text-white ${glowClass} drop-shadow-sm`}>
          {title}
        </h2>
        <div className="flex items-center gap-2 opacity-60">
            <div className={`w-2 h-2 rounded-full ${neonBgClass}`}></div>
            <div className={`h-[1px] w-24 bg-white/30`}></div>
            <div className={`w-2 h-2 rounded-full ${neonBgClass}`}></div>
        </div>
      </div>
    </div>

    {/* Input Area */}
    <div className="p-4 bg-[#131520]/80 border-b border-white/5 z-10">
      <div className="relative flex items-center">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onAdd(side, inputValue, setInputValue)}
          placeholder={isReady ? "INPUT COMMAND..." : "CONNECTING..."}
          disabled={!isReady}
          className={`w-full pl-4 pr-14 py-3 rounded bg-[#1a1d2d] border border-white/10 focus:outline-none focus:border transition-all text-gray-200 placeholder-gray-600 font-mono tracking-wide text-sm
            ${side === 'left' 
              ? 'focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(34,211,238,0.2)]' 
              : 'focus:border-pink-400 focus:shadow-[0_0_10px_rgba(244,114,182,0.2)]'}`}
        />
        <button
          onClick={() => onAdd(side, inputValue, setInputValue)}
          disabled={!inputValue.trim() || !isReady}
          className={`absolute right-2 p-2 rounded text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 disabled:cursor-not-allowed ${neonBgClass}`}
        >
          <Plus size={18} strokeWidth={3} />
        </button>
      </div>
    </div>

    {/* Scrollable List */}
    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-[#0b0d14] z-10 relative">
      <AnimatePresence mode="popLayout">
        {items.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-40 text-gray-600 space-y-3 font-mono"
          >
            <Cloud className="w-12 h-12 opacity-20" />
            <p className="text-xs tracking-[0.2em]">NO DATA // STANDBY</p>
          </motion.div>
        ) : (
          items.map((todo) => (
            <motion.div
              key={todo.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
              className={`group flex items-center gap-3 p-3 rounded border transition-all duration-200 bg-[#151824] relative overflow-hidden
                ${todo.completed 
                  ? 'border-gray-800 opacity-40 grayscale' 
                  : `${borderColorClass} hover:bg-[#1e2130] hover:translate-x-1`}`}
            >
              {!todo.completed && (
                <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${neonBgClass}`}></div>
              )}

              <button
                onClick={() => onToggle(todo.id, todo.completed)}
                className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-all duration-300 relative z-10 ml-2
                  ${todo.completed 
                    ? 'bg-gray-700 border-gray-600' 
                    : `bg-transparent ${borderColorClass} hover:bg-white/5`}`}
              >
                {todo.completed && <Check size={14} className="text-white" strokeWidth={3} />}
              </button>

              <span 
                className={`flex-1 text-[14px] transition-all duration-300 break-all font-mono
                  ${todo.completed 
                    ? 'text-gray-500 line-through' 
                    : 'text-gray-200 font-medium tracking-wide'}`}
              >
                {todo.text}
              </span>

              <button
                onClick={() => onDelete(todo.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-400 rounded transition-all duration-200 z-10"
              >
                <Trash2 size={16} />
              </button>
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </div>
  </div>
);

// ---------------------------------------------------------
// 3. 主组件 (App)
// ---------------------------------------------------------
export default function App() {
  const [user, setUser] = useState(null);
  const [todos, setTodos] = useState([]);
  const [inputLeft, setInputLeft] = useState('');
  const [inputRight, setInputRight] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // --- Auth & Data Sync ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Auth error:", error);
        setErrorMsg("登录失败: " + error.message);
      }
    };
    initAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'apps', APP_ID, 'todos'));
    const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
      const loadedTodos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      loadedTodos.sort((a, b) => b.createdAt - a.createdAt);
      setTodos(loadedTodos);
      setLoading(false);
    }, (error) => {
      if (error.message.includes("billing")) {
          setErrorMsg("配置错误：请检查 Firebase 项目是否需要付费。");
      } else {
          setErrorMsg("连接错误: " + error.message);
      }
      setLoading(false);
    });
    return () => unsubscribeSnapshot();
  }, [user]);

  const handleAddTodo = async (side, text, setText) => {
    if (!text.trim() || !user) return;
    try {
      await addDoc(collection(db, 'apps', APP_ID, 'todos'), {
        text: text.trim(), completed: false, side: side, createdAt: Date.now(), createdBy: user.uid
      });
      setText('');
    } catch (error) {
      alert("写入失败：" + error.message);
    }
  };
  const toggleTodo = async (id, currentStatus) => {
    try {
      const todoRef = doc(db, 'apps', APP_ID, 'todos', id);
      await updateDoc(todoRef, { completed: !currentStatus });
    } catch (error) {}
  };
  const deleteTodo = async (id) => {
    try {
      const todoRef = doc(db, 'apps', APP_ID, 'todos', id);
      await deleteDoc(todoRef);
    } catch (error) {}
  };

  const leftTodos = useMemo(() => todos.filter(t => t.side === 'left'), [todos]);
  const rightTodos = useMemo(() => todos.filter(t => t.side === 'right'), [todos]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0d14] flex-col gap-6">
        <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
        <p className="text-cyan-500 font-cyber text-sm tracking-widest">SYSTEM BOOT...</p>
      </div>
    );
  }

  return (
    // 修改1：根容器允许 Y 轴滚动 (overflow-y-auto)，并去掉强制 h-screen
    // 只有在 md (电脑端) 以上才强制 hidden 和 h-screen
    <div className="min-h-screen bg-[#0b0d14] selection:bg-cyan-500/30 selection:text-white relative font-sans overflow-x-hidden overflow-y-auto md:overflow-hidden">
      {errorMsg && (
        <div className="absolute top-0 left-0 w-full bg-red-900/90 text-white p-3 text-center z-50 border-b border-red-500 font-mono text-sm">
            SYSTEM ERROR: {errorMsg}
        </div>
      )}

      {/* --- 装饰背景 --- */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
         <div className='absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#1e2338] to-transparent opacity-40'></div>
         <div className="absolute bottom-0 left-0 w-full h-1/3 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:40px_40px] [transform:perspective(1000px)_rotateX(60deg)] origin-bottom"></div>
         
         {/* 漂浮装饰 */}
         <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-cyan-500/50 rotate-45 animate-pulse shadow-[0_0_5px_cyan]"></div>
         <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-pink-500/40 rotate-12 animate-pulse shadow-[0_0_5px_pink] delay-700"></div>
         <div className="absolute bottom-1/4 left-10 w-1 h-1 bg-cyan-400/30 animate-ping duration-1000"></div>
         
         {/* UI 标记点 */}
         <div className="absolute top-[15%] left-[5%] text-white/10 font-mono text-xs select-none">+</div>
         <div className="absolute bottom-[15%] right-[5%] text-white/10 font-mono text-xs select-none">+</div>
         <div className="absolute top-[15%] right-[5%] text-white/10 font-mono text-xs select-none">+</div>
         <div className="absolute bottom-[15%] left-[5%] text-white/10 font-mono text-xs select-none">+</div>
      </div>

      {/* 修改2：主容器高度策略调整 */}
      {/* 电脑端 (md): h-screen (一屏显示) */}
      {/* 手机端: min-h-screen (根据内容撑开，允许页面滚动) */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 min-h-screen md:h-screen flex flex-col">
        {/* Title Section */}
        <header className="text-center mb-6 md:mb-10 flex-shrink-0 mt-6 relative">
          <div className="flex items-center justify-center gap-6">
            <div className="hidden md:block animate-[spin_12s_linear_infinite]">
                <Flower className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] opacity-90" size={36} strokeWidth={1.5} />
            </div>
            
            <div className="flex flex-col items-center z-10">
              <h1 className="text-5xl md:text-6xl font-cyber font-black text-white tracking-wider drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">
                CYBER <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-400">SAKURA</span>
              </h1>
              <p className="text-gray-400 text-xs md:text-sm tracking-[0.8em] font-mono mt-3 uppercase opacity-60">
                Neural Sync Established
              </p>
            </div>

            <div className="hidden md:block animate-[spin_12s_linear_infinite_reverse]">
                <Flower className="text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.5)] opacity-90" size={36} strokeWidth={1.5} />
            </div>
          </div>
        </header>

        {/* Two Column Layout */}
        {/* 修改3：布局容器 */}
        {/* md:flex-row (电脑端横排), flex-col (手机端竖排) */}
        {/* 去掉手机端的 flex-1 强制填满，让它自然延伸 */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 md:flex-1 md:min-h-0 pb-8">
          {/* LPH: Cyan Theme */}
          {/* 修改4：每个列表的高度 */}
          {/* md:flex-1 (电脑端自适应) */}
          {/* h-[500px] (手机端固定给 500px 高度，保证空间) */}
          <div className="w-full h-[500px] md:h-auto md:flex-1 min-h-0 relative z-10">
            <TodoList 
              title="LPH // UNIT-01" 
              side="left" 
              colorClass="bg-gradient-to-r from-[#0e3f4a] to-[#0f172a]"
              borderColorClass="border-cyan-500/20 hover:border-cyan-400/50"
              glowClass="text-cyan-400"
              neonBgClass="bg-cyan-600 hover:bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
              items={leftTodos}
              inputValue={inputLeft}
              setInputValue={setInputLeft}
              onAdd={handleAddTodo}
              onToggle={toggleTodo}
              onDelete={deleteTodo}
              isReady={!!user}
            />
          </div>

          {/* LSB: Pink Theme */}
          {/* 同样给手机端 500px 高度 */}
          <div className="w-full h-[500px] md:h-auto md:flex-1 min-h-0 relative z-10">
            <TodoList 
              title="LSB // UNIT-02" 
              side="right" 
              colorClass="bg-gradient-to-r from-[#4a0e2e] to-[#0f172a]"
              borderColorClass="border-pink-500/20 hover:border-pink-400/50"
              glowClass="text-pink-400"
              neonBgClass="bg-pink-600 hover:bg-pink-500 shadow-[0_0_10px_rgba(244,114,182,0.5)]"
              items={rightTodos}
              inputValue={inputRight}
              setInputValue={setInputRight}
              onAdd={handleAddTodo}
              onToggle={toggleTodo}
              onDelete={deleteTodo}
              isReady={!!user}
            />
          </div>
        </div>
        
        <footer className="text-center py-4 text-gray-600 text-xs font-mono tracking-wider z-20">
            <span className="text-cyan-600">&gt;&gt;&gt;</span> SYSTEM ONLINE • <span className="text-pink-600">SYNC ACTIVE</span> <span className="text-cyan-600">&lt;&lt;&lt;</span>
        </footer>
      </div>

      {/* Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
        .font-cyber { font-family: 'Orbitron', sans-serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; background: #0b0d14; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
      `}</style>
    </div>
  );
}