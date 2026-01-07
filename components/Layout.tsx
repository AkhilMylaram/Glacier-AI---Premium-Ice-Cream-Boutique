
import React from 'react';
import { ICONS, APP_NAME } from '../constants';
import { LogOut } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: any;
  cartCount: number;
  onNavigate: (view: string) => void;
  onOpenCart: () => void;
  onSignOut: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, cartCount, onNavigate, onOpenCart, onSignOut }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div 
              className="flex items-center cursor-pointer group"
              onClick={() => onNavigate('home')}
            >
              <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-2.5 rounded-2xl text-white group-hover:shadow-lg group-hover:shadow-indigo-200 transition-all duration-300">
                {ICONS.IceCream}
              </div>
              <span className="ml-4 text-2xl font-bold tracking-tight text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-indigo-800">{APP_NAME}</span>
            </div>

            <div className="hidden md:flex items-center space-x-10">
              <button onClick={() => onNavigate('home')} className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Home</button>
              <button onClick={() => onNavigate('menu')} className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Menu</button>
              <button onClick={() => onNavigate('ai')} className="text-sm font-semibold text-slate-600 hover:text-indigo-600 flex items-center group transition-colors">
                <span className="mr-1.5 group-hover:scale-110 transition-transform">{ICONS.AI}</span> Flavor AI
              </button>
            </div>

            <div className="flex items-center space-x-3 sm:space-x-5">
              <button 
                onClick={onOpenCart}
                className="relative p-2.5 bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-full transition-all"
              >
                {ICONS.Cart}
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1 text-[10px] font-bold leading-none text-white bg-indigo-600 rounded-full border-2 border-white">
                    {cartCount}
                  </span>
                )}
              </button>
              
              {user ? (
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <button 
                    onClick={() => onNavigate('profile')}
                    className="flex items-center p-1 pr-3 sm:pr-4 bg-slate-100 hover:bg-indigo-50 rounded-full transition-all border border-slate-200"
                  >
                    <div className="w-8 h-8 sm:w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                      {user.name?.[0]}
                    </div>
                    <span className="ml-2 sm:ml-3 text-sm font-bold text-slate-700 hidden sm:inline">{user.name.split(' ')[0]}</span>
                  </button>
                  <button 
                    onClick={onSignOut}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-full transition-all border border-red-100 group shadow-sm active:scale-95"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Sign Out</span>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => onNavigate('auth')}
                  className="bg-slate-900 text-white px-5 sm:px-6 py-2 sm:py-2.5 rounded-full text-sm font-bold hover:bg-indigo-600 transition-all shadow-md active:scale-95"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-800 overflow-hidden relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-12">
            
            <div className="flex flex-col items-center md:items-start space-y-4">
              <div className="flex items-center space-x-3">
                <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg">
                  {ICONS.IceCream}
                </div>
                <span className="text-xl font-bold text-white tracking-tight">{APP_NAME}</span>
              </div>
              <p className="text-[10px] text-slate-500 max-w-[180px] text-center md:text-left leading-relaxed font-medium">
                Pioneering artisanal flavors through neural engineering and agentic workflows.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center brand-float">
              <div className="relative group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-500 to-indigo-500 rounded-full blur-2xl opacity-5 group-hover:opacity-20 transition-opacity duration-1000" />
                
                <div className="flex flex-col items-center">
                  <span className="text-3xl md:text-4xl font-black tracking-[0.15em] brand-shimmer neon-glow uppercase select-none transition-all duration-700 group-hover:tracking-[0.2em] group-hover:scale-105">
                    AKHIL
                  </span>
                  <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent mt-3" />
                  <span className="text-[9px] font-black tracking-[0.3em] text-indigo-400/60 mt-3 uppercase whitespace-nowrap">
                    AI AGENT DRIVEN SOLUTIONS
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center md:items-end space-y-6">
              <div className="flex space-x-6">
                <a href="#" className="hover:text-indigo-400 transition-colors text-[10px] font-bold uppercase tracking-widest">Privacy</a>
                <a href="#" className="hover:text-indigo-400 transition-colors text-[10px] font-bold uppercase tracking-widest">Terms</a>
                <a href="#" className="hover:text-indigo-400 transition-colors text-[10px] font-bold uppercase tracking-widest">Contact</a>
              </div>
              <p className="text-[9px] font-black tracking-[0.1em] text-slate-600 uppercase">
                © {new Date().getFullYear()} {APP_NAME}
              </p>
              <div className="flex items-center space-x-2 bg-slate-900/40 px-3 py-1.5 rounded-full border border-slate-800">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[8px] text-indigo-300/70 font-black uppercase tracking-widest">Microservice Mesh Active</span>
              </div>
            </div>

          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
