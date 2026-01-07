
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import ProductCard from './components/ProductCard';
import { Product, CartItem, User, Order } from './types';
import { gateway } from './services/apiGateway';
import { getFlavorRecommendation } from './services/geminiService';
import { ICONS, APP_NAME, CURRENCY } from './constants';

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'menu' | 'ai' | 'auth' | 'profile' | 'checkout'>('home');
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const res = await gateway.request<Product[]>('product', '/list');
      if (res.data) setProducts(res.data);
      setLoading(false);
    };
    init();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await gateway.request<{token: string, user: User}>('auth', '/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'scoops@glacier.ai', password: 'password123' })
    });
    if (res.data) {
      setUser(res.data.user);
      setView('home');
    } else {
      alert(res.error || 'Authentication Failed');
    }
  };

  const addToCart = (product: Product) => {
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
    const orderData = {
      userId: user.id,
      items: cart,
      total: cartTotal,
      status: 'PENDING'
    };
    const res = await gateway.request<Order>('order', '/create', {
      method: 'POST',
      body: JSON.stringify(orderData)
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

  if (loading && view === 'home' && products.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin text-indigo-600">{ICONS.IceCream}</div>
        <p className="text-slate-500 font-medium animate-pulse">Initializing Glacier AI Network...</p>
      </div>
    );
  }

  return (
    <Layout 
      user={user} 
      cartCount={cart.reduce((acc, i) => acc + i.quantity, 0)} 
      onNavigate={(v: any) => setView(v)} 
      onOpenCart={() => setIsCartOpen(true)}
    >
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
                  <button onClick={() => { setIsCartOpen(false); setView('menu'); }} className="mt-4 text-indigo-600 font-bold hover:underline">Browse Menu</button>
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

      {/* ----------------- HOME VIEW ----------------- */}
      {view === 'home' && (
        <div className="pb-24">
          {/* HERO SECTION - COMPACT 60VH HEIGHT */}
          <section className="relative h-[60vh] min-h-[450px] flex items-center overflow-hidden bg-slate-950">
            {/* Background elements */}
            <div className="absolute inset-0">
              <img src="https://images.unsplash.com/photo-1576506295286-5cda18df43e7?q=80&w=2000" className="w-full h-full object-cover opacity-40" alt="Hero" />
              <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/30 to-slate-950" />
              <div className="absolute top-1/2 left-1/4 w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[80px] -translate-y-1/2" />
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
                  <button 
                    onClick={() => setView('menu')} 
                    className="bg-white text-slate-950 px-7 py-3.5 rounded-xl font-black text-sm transition-all hover:scale-105 active:scale-95"
                  >
                    Enter Library
                  </button>
                  <button 
                    onClick={() => setView('ai')} 
                    className="px-7 py-3.5 rounded-xl font-black text-sm text-white bg-indigo-600/20 backdrop-blur-xl border border-indigo-400/30 hover:bg-indigo-600 transition-all flex items-center gap-3 hover:scale-105 active:scale-95"
                  >
                    {ICONS.AI} Concierge AI
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* CURATED SELECTION SECTION */}
          <section className="max-w-7xl mx-auto px-6 pt-16">
            <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
              <div className="max-w-xl">
                <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Curated Batch.</h2>
                <p className="text-slate-500 text-lg font-medium">Limited syntheses, verified by AI.</p>
              </div>
              <button onClick={() => setView('menu')} className="group text-indigo-600 font-black flex items-center text-lg transition-all hover:underline">
                The Archive <span className="ml-2 group-hover:translate-x-1 transition-transform">&rarr;</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.slice(0, 6).map(product => (
                <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ----------------- MENU VIEW ----------------- */}
      {view === 'menu' && (
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="max-w-3xl mb-20">
            <h2 className="text-6xl font-black text-slate-900 mb-6 tracking-tight">Flavor Library</h2>
            <p className="text-slate-500 text-xl leading-relaxed">Browse our complete collection of futuristic and classic flavors. All our products are sourced from sustainable producers and quality-certified by Glacier AI.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {products.map(product => (
              <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
            ))}
          </div>
        </div>
      )}

      {/* ----------------- AI CONCIERGE ----------------- */}
      {view === 'ai' && (
        <div className="max-w-5xl mx-auto px-6 py-24">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-12 md:p-16 border border-slate-100 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-50 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px] opacity-60" />
            <div className="relative z-10">
              <div className="flex items-center gap-6 mb-10">
                <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white text-3xl shadow-xl shadow-indigo-200">
                  {ICONS.AI}
                </div>
                <div>
                  <h2 className="text-5xl font-black text-slate-900 tracking-tight">Flavor Concierge</h2>
                  <p className="text-indigo-600 font-bold uppercase tracking-widest text-xs">Neural Network Recommendation System</p>
                </div>
              </div>
              
              <p className="text-slate-500 mb-12 text-xl leading-relaxed">Describe your mood, the current vibe, or a secret craving. Our AI will analyze your description and match it with the perfect artisan scoop from our inventory.</p>
              
              <div className="space-y-8">
                <div className="relative group">
                  <textarea 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl p-8 text-xl focus:border-indigo-500 focus:bg-white focus:outline-none transition-all duration-300 shadow-inner min-h-[160px]"
                    placeholder="Example: I want something that feels like a sunset in Tokyo, creamy but surprisingly sharp..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        askAI((e.target as HTMLTextAreaElement).value);
                      }
                    }}
                  />
                  <div className="absolute bottom-6 right-6 flex items-center gap-2 text-slate-400 text-sm font-medium">
                    Press <span className="bg-white border px-2 py-0.5 rounded-lg shadow-sm">Enter</span> to analyze
                  </div>
                </div>
                
                <button 
                  onClick={() => askAI((document.querySelector('textarea') as HTMLTextAreaElement).value)}
                  disabled={aiLoading}
                  className="group relative inline-flex items-center justify-center px-10 py-5 bg-slate-900 text-white font-black text-lg rounded-2xl overflow-hidden transition-all hover:bg-indigo-600 disabled:opacity-50"
                >
                  <span className="relative flex items-center gap-3">
                    {aiLoading ? (
                      <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : ICONS.AI}
                    {aiLoading ? 'Synthesizing Taste Profile...' : 'Get Recommendation'}
                  </span>
                </button>
              </div>

              {aiResponse && (
                <div className="mt-16 p-10 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2rem] text-white shadow-2xl shadow-indigo-200 animate-in fade-in slide-in-from-bottom-8 duration-700">
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-sm font-black uppercase tracking-[0.2em] bg-white/20 px-4 py-1.5 rounded-full backdrop-blur-md">Match Found</span>
                  </div>
                  <h3 className="text-4xl font-black mb-6 leading-tight">Our Suggestion: {aiResponse.flavor}</h3>
                  <p className="text-indigo-50 text-xl leading-relaxed mb-10 opacity-90">
                    "{aiResponse.reason}"
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {aiResponse.adjectives.map((adj: string) => (
                      <span key={adj} className="bg-white/15 backdrop-blur-md px-5 py-2 rounded-xl text-sm font-bold border border-white/20">
                        {adj}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- AUTH VIEW ----------------- */}
      {view === 'auth' && (
        <div className="max-w-md mx-auto px-6 py-32">
          <div className="bg-white p-12 rounded-[2.5rem] shadow-2xl border border-slate-100">
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-900 mx-auto mb-6">
                {ICONS.User}
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-2">Welcome Back</h2>
              <p className="text-slate-500 font-medium">Step into the future of taste.</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Email Address</label>
                <input 
                  type="email" 
                  defaultValue="scoops@glacier.ai"
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-medium"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Password</label>
                <input 
                  type="password" 
                  defaultValue="password123"
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-medium"
                  readOnly
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-indigo-600 transition-all shadow-xl active:scale-[0.98]"
              >
                Enter Boutique
              </button>
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 mt-6">
                <p className="text-[10px] text-center text-indigo-600 font-bold uppercase tracking-widest leading-relaxed">
                  Production Mode Simulation<br />Gateway Handshake Verified
                </p>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- PROFILE VIEW ----------------- */}
      {view === 'profile' && (
        <div className="max-w-5xl mx-auto px-6 py-24">
          <div className="flex flex-col md:flex-row items-center gap-10 mb-20">
            <div className="w-32 h-32 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white text-5xl font-black shadow-2xl shadow-indigo-200">
              {user?.name?.[0]}
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-5xl font-black text-slate-900 mb-2">{user?.name}</h2>
              <p className="text-slate-500 text-xl font-medium mb-4">{user?.email}</p>
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-green-50 text-green-700 rounded-full border border-green-100">
                {ICONS.Secure} <span className="text-xs font-black uppercase tracking-widest">Verified Collector</span>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <h3 className="text-3xl font-black text-slate-900 mb-4">Past Transactions</h3>
            {orders.length === 0 ? (
              <div className="bg-white p-20 text-center rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="text-slate-200 scale-150 mb-8">{ICONS.Cart}</div>
                <p className="text-slate-400 text-lg font-medium">Your order history is a blank canvas.</p>
                <button onClick={() => setView('menu')} className="mt-6 text-indigo-600 font-black hover:underline">Start Your Collection</button>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center shadow-sm hover:shadow-md transition-shadow gap-6">
                  <div>
                    <div className="flex items-center gap-4 mb-3">
                      <span className="font-black text-xl text-slate-900 tracking-tight">Order #{order.id}</span>
                      <span className="px-3 py-1 bg-yellow-400 text-slate-900 text-[10px] font-black rounded-lg uppercase tracking-wider">
                        {order.status}
                      </span>
                    </div>
                    <p className="text-slate-500 font-medium">
                      {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })} &bull; {order.items.length} artisan scoops
                    </p>
                  </div>
                  <div className="sm:text-right w-full sm:w-auto border-t sm:border-0 pt-6 sm:pt-0">
                    <p className="font-black text-3xl text-slate-900 mb-2">{CURRENCY}{order.total.toFixed(2)}</p>
                    <button className="text-sm text-indigo-600 font-bold hover:bg-indigo-50 px-4 py-2 rounded-xl transition-all">Download Receipt</button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="mt-20 pt-10 border-t border-slate-100 flex justify-center">
             <button 
              onClick={() => { setUser(null); setView('home'); }} 
              className="px-8 py-3 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 text-sm font-black transition-all uppercase tracking-widest"
            >
              Sign Out from Gateway Session
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
