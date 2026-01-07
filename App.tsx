
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import ProductCard from './components/ProductCard';
import { Product, CartItem, User, Order } from './types';
import { gateway } from './services/apiGateway';
import { getFlavorRecommendation } from './services/geminiService';
import { ICONS, CURRENCY } from './constants';

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'menu' | 'ai' | 'auth' | 'profile' | 'checkout'>('home');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Auth Form State
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const res = await gateway.request<Product[]>('product', '/list');
      if (res.data) setProducts(res.data);
      setLoading(false);
    };
    init();
  }, []);

  // Protected View Logic
  const navigateTo = (v: any) => {
    if (v === 'home' || v === 'auth') {
      setView(v);
      setAuthError(null);
      return;
    }
    
    if (!user) {
      setAuthMode('login');
      setView('auth');
      setShowAuthModal(true);
      setAuthError(null);
      return;
    }
    
    setView(v);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    
    const endpoint = authMode === 'login' ? '/login' : '/register';
    const res = await gateway.request<{token: string, user: User}>('auth', endpoint, {
      method: 'POST',
      body: JSON.stringify(formData)
    });

    if (res.data) {
      setUser(res.data.user);
      setView('home');
      setFormData({ name: '', email: '', password: '' });
      setShowAuthModal(false);
    } else {
      setAuthError(res.error || 'Authentication Failed');
    }
    setAuthLoading(false);
  };

  const handleSignOut = () => {
    setUser(null);
    setCart([]);
    setOrders([]);
    setView('home');
    setAuthError(null);
    setIsCartOpen(false);
  };

  const addToCart = (product: Product) => {
    if (!user) {
      setAuthMode('signup');
      setView('auth');
      setShowAuthModal(true);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (!user) {
      setView('auth');
      setIsCartOpen(false);
      return;
    }
    setLoading(true);
    const res = await gateway.request<Order>('order', '/create', {
      method: 'POST',
      body: JSON.stringify({ userId: user.id, items: cart, total: cartTotal, status: 'PENDING' })
    });
    
    if (res.data) {
      setCart([]);
      setIsCartOpen(false);
      const orderRes = await gateway.request<Order[]>('order', '/my-orders', {
        method: 'POST',
        body: JSON.stringify({ userId: user.id })
      });
      if (orderRes.data) setOrders(orderRes.data);
      setView('profile');
    }
    setLoading(false);
  };

  const askAI = async (prompt: string) => {
    if (!prompt.trim()) return;
    setAiLoading(true);
    const rec = await getFlavorRecommendation(prompt);
    setAiResponse(rec);
    setAiLoading(false);
  };

  if (loading && products.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-4 bg-slate-950">
        <div className="animate-spin text-indigo-400">{ICONS.IceCream}</div>
        <p className="text-indigo-200/50 font-bold uppercase tracking-[0.3em] animate-pulse text-[10px]">Encrypting Gateway Link...</p>
      </div>
    );
  }

  return (
    <Layout 
      user={user} 
      cartCount={cart.reduce((acc, i) => acc + i.quantity, 0)} 
      onNavigate={navigateTo} 
      onOpenCart={() => user ? setIsCartOpen(true) : navigateTo('auth')}
      onSignOut={handleSignOut}
    >
      {/* ----------------- AUTH REQUIRED POPUP ----------------- */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowAuthModal(false)} />
          <div className="relative bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              {ICONS.Secure}
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Member Access Only</h3>
            <p className="text-slate-500 mb-8 font-medium">To browse the menu, use our AI, or manage your profile, please sign in or create an account.</p>
            <button 
              onClick={() => setShowAuthModal(false)}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black hover:bg-indigo-600 transition-all shadow-xl"
            >
              Understand
            </button>
          </div>
        </div>
      )}

      {/* ----------------- CART OVERLAY ----------------- */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[60] overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300" onClick={() => setIsCartOpen(false)} />
          <div className="absolute inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out">
            <div className="p-8 border-b flex justify-between items-center bg-white">
              <h2 className="text-3xl font-bold text-slate-900">Your Bag</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">&times;</button>
            </div>
            <div className="flex-grow overflow-y-auto p-8 space-y-8 bg-slate-50">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-slate-300">
                  <div className="scale-[2] mb-8">{ICONS.IceCream}</div>
                  <p className="text-lg font-medium">Your scoop bag is empty.</p>
                  <button onClick={() => { setIsCartOpen(false); navigateTo('menu'); }} className="mt-4 text-indigo-600 font-bold hover:underline">Browse Menu</button>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex gap-5 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <img src={item.imageUrl} className="w-24 h-24 rounded-xl object-cover" alt="" />
                    <div className="flex-grow">
                      <h4 className="font-bold text-slate-900 text-lg leading-tight mb-1">{item.name}</h4>
                      <p className="text-indigo-600 font-bold mb-2">{item.quantity} x {CURRENCY}{item.price.toFixed(2)}</p>
                      <button onClick={() => removeFromCart(item.id)} className="text-xs text-red-500 font-semibold hover:bg-red-50 px-2 py-1 rounded transition-colors">Remove Item</button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-8 border-t bg-white">
              <div className="flex justify-between items-center text-2xl font-black text-slate-900 mb-8">
                <span>Total</span>
                <span>{CURRENCY}{cartTotal.toFixed(2)}</span>
              </div>
              <button 
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-700 text-white py-5 rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-indigo-200 transition-all disabled:opacity-50 active:scale-[0.98]"
              >
                Secure Checkout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- HOME VIEW (Public) ----------------- */}
      {view === 'home' && (
        <div className="pb-24">
          <section className="relative h-[60vh] min-h-[450px] flex items-center overflow-hidden bg-slate-950">
            <div className="absolute inset-0">
              <img src="https://images.unsplash.com/photo-1576506295286-5cda18df43e7?q=80&w=2000" className="w-full h-full object-cover opacity-40" alt="Hero" />
              <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/30 to-slate-950" />
            </div>
            <div className="relative max-w-7xl mx-auto px-6 w-full z-10 py-8">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-3 px-4 py-1.5 mb-5 text-[9px] font-black tracking-[0.3em] text-indigo-400 uppercase bg-indigo-500/10 backdrop-blur-xl rounded-full border border-indigo-400/20">
                  {ICONS.AI} The Next Era of Taste
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-white mb-5 leading-[0.95] tracking-tighter">
                  Frozen <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-indigo-500 italic">Perfection.</span>
                </h1>
                <p className="text-base md:text-lg text-slate-400 mb-8 leading-relaxed font-light max-w-md">
                  Bespoke micro-batches engineered precisely for your palate by our sensory AI. Future flavor, calculated today.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button onClick={() => navigateTo('menu')} className="bg-white text-slate-950 px-7 py-3.5 rounded-xl font-black text-sm transition-all hover:scale-105 active:scale-95">Enter Library</button>
                  <button onClick={() => navigateTo('ai')} className="px-7 py-3.5 rounded-xl font-black text-sm text-white bg-indigo-600/20 backdrop-blur-xl border border-indigo-400/30 hover:bg-indigo-600 transition-all flex items-center gap-3 hover:scale-105 active:scale-95">{ICONS.AI} Concierge AI</button>
                </div>
              </div>
            </div>
          </section>
          
          <section className="max-w-7xl mx-auto px-6 pt-16">
            <div className="flex justify-between items-end mb-10">
              <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Public Batch.</h2>
                <p className="text-slate-400 text-sm font-medium mt-1">Samples available for guest viewing.</p>
              </div>
              <button onClick={() => navigateTo('menu')} className="text-indigo-600 font-black flex items-center hover:underline">Full Archive &rarr;</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.slice(0, 6).map(product => <ProductCard key={product.id} product={product} onAddToCart={addToCart} />)}
            </div>
          </section>
        </div>
      )}

      {/* ----------------- AUTH VIEW ----------------- */}
      {view === 'auth' && (
        <div className="max-w-md mx-auto px-6 py-24 animate-in fade-in duration-500">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500" />
            
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">{ICONS.User}</div>
              <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">{authMode === 'login' ? 'Sign In' : 'New Account'}</h2>
              <p className="text-slate-500 font-medium text-sm">Access the secure taste network infrastructure.</p>
            </div>

            {authError && (
              <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2">
                <div className="w-8 h-8 bg-red-500 text-white rounded-lg flex items-center justify-center text-lg font-bold">!</div>
                <div>
                  <p className="text-red-700 text-sm font-black">{authError}</p>
                  {authError.includes('create an account') && (
                    <button 
                      onClick={() => setAuthMode('signup')}
                      className="text-red-500 text-xs font-bold hover:underline mt-0.5"
                    >
                      Switch to Sign Up
                    </button>
                  )}
                </div>
              </div>
            )}
            
            <form onSubmit={handleAuth} className="space-y-5">
              {authMode === 'signup' && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1 tracking-widest">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Identity Label"
                    className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium outline-none"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1 tracking-widest">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  placeholder="name@glacier.ai"
                  className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2 ml-1 tracking-widest">Access Key</label>
                <input 
                  type="password" 
                  required
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  placeholder="••••••••"
                  className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium outline-none"
                />
              </div>
              
              <button 
                type="submit"
                disabled={authLoading}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-indigo-600 transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 tracking-tight"
              >
                {authLoading && <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                {authMode === 'login' ? 'Verify Credentials' : 'Initialize Account'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <button 
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'signup' : 'login');
                  setAuthError(null);
                }}
                className="text-sm font-bold text-indigo-600 hover:text-slate-950 transition-colors"
              >
                {authMode === 'login' ? "New here? Create Access Profile" : "Existing Member? Return to Login"}
              </button>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 mt-8">
              <p className="text-[9px] text-center text-slate-500 font-black uppercase tracking-[0.2em] leading-relaxed">
                MySQL Persistent Connection Active<br />Java Production Handshake Encrypted
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- PROFILE VIEW (Protected) ----------------- */}
      {view === 'profile' && user && (
        <div className="max-w-5xl mx-auto px-6 py-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-xl mb-12">
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="w-32 h-32 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white text-5xl font-black shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                {user.name[0]}
              </div>
              <div className="flex-grow text-center md:text-left">
                <h2 className="text-5xl font-black text-slate-900 mb-2 tracking-tight">{user.name}</h2>
                <p className="text-slate-500 text-xl font-medium mb-6">{user.email}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full border border-green-100">
                    {ICONS.Secure} <span className="text-[10px] font-black uppercase tracking-widest">Authenticated Collector</span>
                  </div>
                  <button 
                    onClick={handleSignOut}
                    className="inline-flex items-center gap-2 px-6 py-2 bg-red-50 text-red-600 rounded-full border border-red-100 hover:bg-red-600 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest"
                  >
                    Terminate Session
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <h3 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Order Logs</h3>
              <div className="space-y-6">
                {orders.length === 0 ? (
                  <div className="bg-white p-12 rounded-[2rem] border border-slate-100 text-center shadow-sm">
                    <p className="text-slate-400 font-medium">No production logs found in the MySQL database.</p>
                  </div>
                ) : (
                  orders.map(o => (
                    <div key={o.id} className="bg-white p-8 rounded-3xl border border-slate-100 flex justify-between items-center shadow-sm hover:border-indigo-200 transition-colors">
                      <div>
                        <p className="font-black text-lg text-slate-900">Reference #{o.id}</p>
                        <p className="text-slate-500 text-sm">{new Date(o.createdAt).toLocaleDateString()} • {o.items.length} Units Synthesis</p>
                      </div>
                      <p className="text-2xl font-black text-slate-900">{CURRENCY}{o.total.toFixed(2)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="space-y-8">
               <h3 className="text-3xl font-black text-slate-900 tracking-tight">System Info</h3>
               <div className="bg-slate-950 p-8 rounded-[2.5rem] text-slate-400 space-y-6">
                  <div>
                    <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-1">User Role</p>
                    <p className="text-white font-bold">{user.role.toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-1">Account ID</p>
                    <p className="text-white font-mono text-sm">{user.id}</p>
                  </div>
                  <div className="pt-6 border-t border-slate-800">
                    <p className="text-[9px] leading-relaxed opacity-50 italic">Account synchronized via high-speed Java API Gateway. Data persisted in MySQL cluster node 4-B.</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- MENU VIEW (Protected) ----------------- */}
      {view === 'menu' && (
        <div className="max-w-7xl mx-auto px-6 py-24 animate-in fade-in duration-500">
          <div className="max-w-3xl mb-16">
            <h2 className="text-6xl font-black text-slate-900 mb-4 tracking-tighter">Full Archive</h2>
            <p className="text-slate-500 text-lg font-medium leading-relaxed">Browse the complete experimental database. These micro-batches are restricted for authenticated members only.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {products.map(p => <ProductCard key={p.id} product={p} onAddToCart={addToCart} />)}
          </div>
        </div>
      )}
      
      {/* ----------------- AI VIEW (Protected) ----------------- */}
      {view === 'ai' && (
        <div className="max-w-4xl mx-auto px-6 py-24 animate-in zoom-in-95 duration-500">
          <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <h2 className="text-4xl font-black text-slate-900 mb-8 flex items-center gap-4 relative z-10 tracking-tight">{ICONS.AI} Flavor Concierge</h2>
            <p className="text-slate-500 mb-8 font-medium relative z-10">Describe your sensory preference and our neural engine will determine your perfect match.</p>
            <textarea 
              className="w-full bg-slate-50 rounded-2xl p-6 text-lg border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all mb-6 min-h-[150px] relative z-10 font-medium"
              placeholder="e.g. 'I want something smoky and complex with a hint of floral sweetness'..."
            />
            <button 
              onClick={() => askAI((document.querySelector('textarea') as HTMLTextAreaElement).value)}
              disabled={aiLoading}
              className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black hover:bg-indigo-600 transition-all flex items-center gap-3 disabled:opacity-50 relative z-10 shadow-xl"
            >
              {aiLoading ? <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : ICONS.AI}
              {aiLoading ? 'Accessing Neural Node...' : 'Calculate Perfect Scoop'}
            </button>
            {aiResponse && (
              <div className="mt-10 p-10 bg-indigo-600 text-white rounded-[2.5rem] animate-in slide-in-from-bottom-6 duration-700 shadow-2xl shadow-indigo-200">
                <div className="flex items-center gap-3 mb-4">
                   <div className="bg-white/20 p-2 rounded-lg">{ICONS.Sparkles}</div>
                   <h3 className="text-2xl font-black tracking-tight">Neural Match: {aiResponse.flavor}</h3>
                </div>
                <p className="opacity-90 leading-relaxed font-medium text-lg">{aiResponse.reason}</p>
                <div className="flex gap-3 mt-8">
                   {aiResponse.adjectives.map((a: string) => (
                     <span key={a} className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">{a}</span>
                   ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
