
import React from 'react';
import { ICONS, APP_NAME } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  user: any;
  cartCount: number;
  onNavigate: (view: string) => void;
  onOpenCart: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, cartCount, onNavigate, onOpenCart }) => {
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

            <div className="flex items-center space-x-5">
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
                <button 
                  onClick={() => onNavigate('profile')}
                  className="flex items-center p-1 pr-4 bg-slate-100 hover:bg-indigo-50 rounded-full transition-all border border-slate-200"
                >
                  <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                    {user.name?.[0]}
                  </div>
                  <span className="ml-3 text-sm font-bold text-slate-700 hidden sm:inline">{user.name.split(' ')[0]}</span>
                </button>
              ) : (
                <button 
                  onClick={() => onNavigate('auth')}
                  className="bg-slate-900 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-indigo-600 transition-all shadow-md active:scale-95"
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

      <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center space-x-4">
              <div className="bg-slate-800 p-2 rounded-lg">{ICONS.IceCream}</div>
              <span className="text-xl font-bold text-white tracking-wider">{APP_NAME}</span>
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-sm font-light leading-relaxed">
                © {new Date().getFullYear()} {APP_NAME}. All rights reserved.<br />
                Designed & Developed with precision by <span className="text-indigo-400 font-bold hover:text-white transition-colors cursor-default drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]">AKHIL</span>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
