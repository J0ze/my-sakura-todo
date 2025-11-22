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
import { Trash2, Check, Plus, Flower, Sparkles, Cloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const firebaseConfig = {
  apiKey: "AIzaSyCQHMnCB9OUDTDRn31z4PljX6oE0h_HwZg",
  authDomain: "sakura-todo-de8a7.firebaseapp.com",
  projectId: "sakura-todo-de8a7",
  storageBucket: "sakura-todo-de8a7.firebasestorage.app",
  messagingSenderId: "660499382018",
  appId: "1:660499382018:web:fd90a2a9e329bae4e5cc1b",
  measurementId: "G-DY7V2JQ4E7"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 定义一个固定的 ID，确保数据存在同一个集合下
const APP_ID = 'my-shared-todo-v1'; 

export default function App() {
  const [user, setUser] = useState(null);
  const [todos, setTodos] = useState([]);
  const [inputLeft, setInputLeft] = useState('');
  const [inputRight, setInputRight] = useState('');
  const [loading, setLoading] = useState(true);

  // --- Auth & Data Sync ---
  useEffect(() => {
    // 简化后的登录逻辑：直接匿名登录
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Auth error:", error);
      }
    };

    initAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    // 监听数据
    const q = query(collection(db, 'apps', APP_ID, 'todos'));

    const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
      const loadedTodos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      loadedTodos.sort((a, b) => b.createdAt - a.createdAt);
      setTodos(loadedTodos);
      setLoading(false);
    }, (error) => {
      console.error("Data fetch error:", error);
      setLoading(false);
    });

    return () => unsubscribeSnapshot();
  }, [user]);

  // --- Actions ---
  const handleAddTodo = async (side, text, setText) => {
    if (!text.trim() || !user) return;
    
    try {
      await addDoc(collection(db, 'apps', APP_ID, 'todos'), {
        text: text.trim(),
        completed: false,
        side: side, 
        createdAt: Date.now(),
        createdBy: user.uid
      });
      setText('');
    } catch (error) {
      console.error("Error adding todo:", error);
    }
  };

  const toggleTodo = async (id, currentStatus) => {
    try {
      const todoRef = doc(db, 'apps', APP_ID, 'todos', id);
      await updateDoc(todoRef, {
        completed: !currentStatus
      });
    } catch (error) {
      console.error("Error toggling todo:", error);
    }
  };

  const deleteTodo = async (id) => {
    try {
      const todoRef = doc(db, 'apps', APP_ID, 'todos', id);
      await deleteDoc(todoRef);
    } catch (error) {
      console.error("Error deleting todo:", error);
    }
  };

  // Filter todos
  const leftTodos = useMemo(() => todos.filter(t => t.side === 'left'), [todos]);
  const rightTodos = useMemo(() => todos.filter(t => t.side === 'right'), [todos]);

  // --- UI Components ---
  // Shared List Component to DRY up code
  const TodoList = ({ items, side, inputValue, setInputValue, title, colorClass, icon: Icon }) => (
    <div className={`flex-1 flex flex-col bg-white/80 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden border-2 ${side === 'left' ? 'border-pink-200' : 'border-purple-200'} h-full max-h-[800px]`}>
      {/* Header */}
      <div className={`p-6 ${colorClass} text-white relative overflow-hidden`}>
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
            <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white blur-2xl"></div>
            <div className="absolute left-4 bottom-4 w-16 h-16 rounded-full bg-white blur-xl"></div>
        </div>
        <div className="relative z-10 flex items-center justify-center gap-2">
          <Icon className="w-6 h-6 animate-pulse" />
          <h2 className="text-xl font-bold tracking-wider">{title}</h2>
        </div>
        <p className="text-center text-white/80 text-xs mt-1 font-medium tracking-widest">TO DO LIST</p>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white/50 border-b border-gray-100">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTodo(side, inputValue, setInputValue)}
            placeholder="添加新的待办事项..."
            className={`w-full pl-4 pr-12 py-3 rounded-full bg-white border focus:outline-none focus:ring-2 transition-all shadow-sm text-gray-600 placeholder-gray-400
              ${side === 'left' 
                ? 'border-pink-100 focus:border-pink-300 focus:ring-pink-100' 
                : 'border-purple-100 focus:border-purple-300 focus:ring-purple-100'}`}
          />
          <button
            onClick={() => handleAddTodo(side, inputValue, setInputValue)}
            disabled={!inputValue.trim()}
            className={`absolute right-2 p-2 rounded-full text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100
              ${side === 'left' ? 'bg-pink-400 hover:bg-pink-500' : 'bg-purple-400 hover:bg-purple-500'}`}
          >
            <Plus size={18} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {items.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-40 text-gray-300 space-y-2"
            >
              <Cloud className="w-10 h-10 opacity-50" />
              <p className="text-sm font-light">暂无待办，享受生活吧</p>
            </motion.div>
          ) : (
            items.map((todo) => (
              <motion.div
                key={todo.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                className={`group flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300 hover:shadow-md bg-white
                  ${todo.completed ? 'bg-gray-50/80 border-gray-100' : 'border-white shadow-sm'}`}
              >
                <button
                  onClick={() => toggleTodo(todo.id, todo.completed)}
                  className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300
                    ${todo.completed 
                      ? (side === 'left' ? 'bg-pink-400 border-pink-400' : 'bg-purple-400 border-purple-400') 
                      : 'border-gray-300 hover:border-gray-400 bg-white'}`}
                >
                  <motion.div
                    initial={false}
                    animate={{ scale: todo.completed ? 1 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  >
                    <Check size={14} className="text-white" strokeWidth={3} />
                  </motion.div>
                </button>

                <span 
                  className={`flex-1 text-sm transition-all duration-300 break-all
                    ${todo.completed ? 'text-gray-400 line-through decoration-2 decoration-gray-200' : 'text-gray-700 font-medium'}`}
                >
                  {todo.text}
                </span>

                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-full transition-all duration-200"
                  title="删除"
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdf2f8] selection:bg-pink-100 relative font-sans overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
         {/* Sakura Circles */}
         <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-pink-200/20 blur-3xl"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-200/20 blur-3xl"></div>
         
         {/* Falling Petals (Simulated with CSS/SVGs positioned absolutely) */}
         <Flower className="absolute top-20 left-[10%] text-pink-200/40 w-12 h-12 rotate-12" />
         <Flower className="absolute bottom-40 right-[20%] text-pink-300/30 w-8 h-8 -rotate-45" />
         <Sparkles className="absolute top-1/2 left-1/2 text-yellow-200/40 w-24 h-24 animate-pulse" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 h-screen flex flex-col">
        {/* Main Title */}
        <header className="text-center mb-8 flex-shrink-0">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 tracking-tight mb-2 flex items-center justify-center gap-3">
            <Flower className="text-pink-400 animate-spin-slow" size={32} />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
              二人のリスト
            </span>
            <Flower className="text-purple-400 animate-spin-slow" size={32} />
          </h1>
          <p className="text-gray-500 text-sm tracking-widest font-light">SHARED CLOUD TODOS</p>
        </header>

        {/* Two Column Layout */}
        <div className="flex-1 flex flex-col md:flex-row gap-6 md:gap-8 min-h-0 pb-4">
          {/* User A (Sakura/Left) */}
          <div className="flex-1 min-h-0">
            <TodoList 
              title="LPH" 
              side="left" 
              colorClass="bg-gradient-to-r from-pink-400 to-pink-500"
              items={leftTodos}
              inputValue={inputLeft}
              setInputValue={setInputLeft}
              icon={Flower}
            />
          </div>

          {/* User B (Lavender/Right) */}
          <div className="flex-1 min-h-0">
             <TodoList 
              title="LSB" 
              side="right" 
              colorClass="bg-gradient-to-r from-purple-400 to-purple-500"
              items={rightTodos}
              inputValue={inputRight}
              setInputValue={setInputRight}
              icon={Sparkles}
            />
          </div>
        </div>
        
        <footer className="text-center py-2 text-gray-400 text-xs">
            数据已实时云端同步 • 所有的修改对方即刻可见
        </footer>
      </div>

      {/* Global Styles for Scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(200, 200, 200, 0.3);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(200, 200, 200, 0.5);
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 10s linear infinite;
        }
      `}</style>
    </div>
  );
}
