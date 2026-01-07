
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Layout from './components/Layout';
import ProductCard from './components/ProductCard';
import { Product, CartItem, User, Order } from './types';
import { gateway } from './services/apiGateway';
import { getFlavorRecommendation, connectVoiceAssistant } from './services/geminiService';
import { encode, decode, decodeAudioData } from './services/audioUtils';
import { ICONS, CURRENCY } from './constants';
import { MicOff, Volume2 } from 'lucide-react';

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
  
  // AI State
  const [aiMode, setAiMode] = useState<'text' | 'voice'>('text');
  const [textPrompt, setTextPrompt] = useState('');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string[]>([]);
  
  // Audio Refs
  const audioContextRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const voiceSessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Auth Form State
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await gateway.request<Product[]>('product', '/list');
      if (res.data) setProducts(res.data);
    } catch (error) {
      console.error("Failed to load catalog:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrders = useCallback(async (userId: string) => {
    try {
      const orderRes = await gateway.request<Order[]>('order', '/my-orders', {
        method: 'POST',
        body: JSON.stringify({ userId })
      });
      if (orderRes.data) setOrders(orderRes.data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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

    if (v === 'profile') fetchOrders(user.id);
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
      await fetchOrders(res.data.user.id);
      setView('home');
      setFormData({ name: '', email: '', password: '' });
      setShowAuthModal(false);
    } else {
      setAuthError(res.error || 'Authentication Failed');
    }
    setAuthLoading(false);
  };

  const stopVoiceSession = () => {
    if (voiceSessionRef.current) {
      voiceSessionRef.current.close();
      voiceSessionRef.current = null;
    }
    audioSourcesRef.current.forEach(s => s.stop());
    audioSourcesRef.current.clear();
    setIsVoiceActive(false);
  };

  const startVoiceSession = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      if (!audioContextRef.current) {
        audioContextRef.current = {
          input: new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 }),
          output: new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 })
        };
      }

      const sessionPromise = connectVoiceAssistant({
        onopen: () => {
          setIsVoiceActive(true);
          const source = audioContextRef.current!.input.createMediaStreamSource(stream);
          const scriptProcessor = audioContextRef.current!.input.createScriptProcessor(4096, 1, 1);
          
          scriptProcessor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const l = inputData.length;
            const int16 = new Int16Array(l);
            for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
            
            const pcmBlob = {
              data: encode(new Uint8Array(int16.buffer)),
              mimeType: 'audio/pcm;rate=16000',
            };
            
            sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
          };

          source.connect(scriptProcessor);
          scriptProcessor.connect(audioContextRef.current!.input.destination);
        },
        onmessage: async (msg: any) => {
          const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (base64Audio && audioContextRef.current) {
            const outCtx = audioContextRef.current.output;
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
            const buffer = await decodeAudioData(decode(base64Audio), outCtx, 24000, 1);
            const source = outCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(outCtx.destination);
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += buffer.duration;
            audioSourcesRef.current.add(source);
            source.onended = () => audioSourcesRef.current.delete(source);
          }
        },
        onclose: () => stopVoiceSession(),
        onerror: (e: any) => {
          console.error("Voice Session Error:", e);
          stopVoiceSession();
        }
      });

      voiceSessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Mic access denied:", err);
    }
  };

  const handleSignOut = () => {
    stopVoiceSession();
    setUser(null);
    setCart([]);
    setOrders([]);
    setView('home');
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
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (!user) return navigateTo('auth');
    setLoading(true);
    const res = await gateway.request<Order>('order', '/create', {
      method: 'POST',
      body: JSON.stringify({ userId: user.id, items: cart, total: cartTotal, status: 'PENDING' })
    });
    if (res.data) {
      setCart([]);
      setIsCartOpen(false);
      await fetchOrders(user.id);
      setView('profile');
    }
    setLoading(false);
  };

  const askAI = async () => {
    if (!textPrompt.trim()) return;
    setAiLoading(true);
    const rec = await getFlavorRecommendation(textPrompt);
    setAiResponse(rec);
    setAiLoading(false);
  };

  if (loading && products.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-4 bg-slate-950">
        <div className="animate-spin text-indigo-400 scale-150">{ICONS.IceCream}</div>
        <p className="text-indigo-200/50 font-black uppercase tracking-[0.4em] animate-pulse text-[10px]">Synchronizing Mesh Catalog</p>
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
      {/* Auth Modal & Cart Overlay logic remains identical to provided App.tsx */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowAuthModal(false)} />
          <div className="relative bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6">{ICONS.Secure}</div>
            <h3 className="text-2xl font-black mb-2">Member Access Only</h3>
            <button onClick={() => setShowAuthModal(false)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black">Understand</button>
          </div>
        </div>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 z-[60] overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          <div className="absolute inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl flex flex-col">
            <div className="p-8 border-b flex justify-between items-center"><h2 className="text-3xl font-bold">Your Bag</h2><button onClick={() => setIsCartOpen(false)}>&times;</button></div>
            <div className="flex-grow overflow-y-auto p-8 space-y-8 bg-slate-50">
              {cart.map(item => (
                <div key={item.id} className="flex gap-5 bg-white p-4 rounded-2xl shadow-sm">
                  <img src={item.imageUrl} className="w-24 h-24 rounded-xl object-cover" alt="" />
                  <div className="flex-grow">
                    <h4 className="font-bold text-lg">{item.name}</h4>
                    <p className="text-indigo-600 font-bold">{item.quantity} x {CURRENCY}{item.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-8 border-t"><button onClick={handleCheckout} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold">Secure Checkout</button></div>
          </div>
        </div>
      )}

      {view === 'home' && (
        <div className="pb-24">
          <section className="relative h-[70vh] flex items-center overflow-hidden bg-slate-950">
            <div className="absolute inset-0"><img src="https://images.unsplash.com/photo-1576506295286-5cda18df43e7?q=80&w=2000" className="w-full h-full object-cover opacity-60" alt="" /><div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 to-slate-950" /></div>
            <div className="relative max-w-7xl mx-auto px-6 w-full z-10">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-3 px-4 py-1.5 mb-5 text-[9px] font-black tracking-[0.3em] text-indigo-400 uppercase bg-indigo-500/10 rounded-full">{ICONS.AI} The Next Era of Taste</div>
                <h1 className="text-7xl md:text-8xl font-black text-white mb-5 leading-none">Frozen <br /><span className="text-indigo-400 italic">Perfection.</span></h1>
                <div className="flex gap-4"><button onClick={() => navigateTo('menu')} className="bg-white text-slate-950 px-8 py-4 rounded-xl font-black">Enter Library</button><button onClick={() => navigateTo('ai')} className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-black flex items-center gap-3">{ICONS.AI} Concierge AI</button></div>
              </div>
            </div>
          </section>
          <section className="max-w-7xl mx-auto px-6 pt-24"><div className="grid grid-cols-1 md:grid-cols-3 gap-12">{products.slice(0, 6).map(p => <ProductCard key={p.id} product={p} onAddToCart={addToCart} />)}</div></section>
        </div>
      )}

      {view === 'menu' && (
        <div className="max-w-7xl mx-auto px-6 py-24"><h2 className="text-6xl font-black mb-12">Full Archive</h2><div className="grid grid-cols-1 md:grid-cols-3 gap-12">{products.map(p => <ProductCard key={p.id} product={p} onAddToCart={addToCart} />)}</div></div>
      )}

      {view === 'ai' && (
        <div className="max-w-4xl mx-auto px-6 py-24 animate-in zoom-in-95 duration-500">
          <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex border-b border-slate-100">
              <button 
                onClick={() => { setAiMode('text'); stopVoiceSession(); }}
                className={`flex-1 py-6 font-black text-sm uppercase tracking-widest transition-all ${aiMode === 'text' ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Neural Text
              </button>
              <button 
                onClick={() => setAiMode('voice')}
                className={`flex-1 py-6 font-black text-sm uppercase tracking-widest transition-all ${aiMode === 'voice' ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Sensory Voice
              </button>
            </div>

            <div className="p-12">
              {aiMode === 'text' ? (
                <div className="space-y-8">
                  <div className="relative">
                    <textarea 
                      value={textPrompt}
                      onChange={(e) => setTextPrompt(e.target.value)}
                      className="w-full bg-slate-50 rounded-2xl p-8 text-xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all min-h-[180px] font-medium"
                      placeholder="Describe your desired sensory experience..."
                    />
                    <div className="absolute bottom-4 right-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">LLM NODE ACTIVE</div>
                  </div>
                  <button 
                    onClick={askAI}
                    disabled={aiLoading || !textPrompt.trim()}
                    className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-lg hover:bg-indigo-600 transition-all flex items-center justify-center gap-4 disabled:opacity-50 shadow-xl"
                  >
                    {aiLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : ICONS.AI}
                    {aiLoading ? 'Synthesizing Recommendation...' : 'Calculate Perfect Match'}
                  </button>
                  
                  {aiResponse && (
                    <div className="p-10 bg-indigo-600 text-white rounded-[2.5rem] animate-in slide-in-from-bottom-6 duration-700 shadow-2xl shadow-indigo-200">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="bg-white/20 p-3 rounded-xl">{ICONS.Sparkles}</div>
                        <h3 className="text-3xl font-black">{aiResponse.flavor}</h3>
                      </div>
                      <p className="opacity-90 leading-relaxed font-medium text-lg mb-8 italic">"{aiResponse.reason}"</p>
                      <div className="flex flex-wrap gap-3">
                        {aiResponse.adjectives.map((a: string) => (
                          <span key={a} className="bg-white/10 backdrop-blur-md px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/20">{a}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center py-12 space-y-12">
                  <div className="relative group">
                    <div className={`absolute inset-0 bg-indigo-500 rounded-full blur-3xl transition-opacity duration-1000 ${isVoiceActive ? 'opacity-20 animate-pulse' : 'opacity-0'}`} />
                    <button 
                      onClick={isVoiceActive ? stopVoiceSession : startVoiceSession}
                      className={`relative w-40 h-40 rounded-full flex flex-col items-center justify-center gap-2 transition-all duration-500 shadow-2xl active:scale-95 ${isVoiceActive ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                    >
                      {isVoiceActive ? <MicOff className="w-10 h-10" /> : <Volume2 className="w-10 h-10" />}
                      <span className="text-[10px] font-black uppercase tracking-widest">{isVoiceActive ? 'Disconnect' : 'Connect'}</span>
                    </button>
                  </div>
                  
                  <div className="text-center max-w-sm">
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Artisanal Voice Concierge</h3>
                    <p className="text-slate-500 font-medium">Connect to the neural network for a real-time sensory consultation.</p>
                  </div>

                  {isVoiceActive && (
                    <div className="w-full space-y-4">
                      <div className="flex items-center justify-center gap-1.5 h-8">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="w-1 bg-indigo-400 rounded-full animate-[bounce_1s_infinite]" style={{ animationDelay: `${i * 0.1}s`, height: `${Math.random() * 100}%` }} />
                        ))}
                      </div>
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                        <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Live Audio Channel Open</p>
                        <p className="text-slate-400 text-[10px] italic">Speak naturally about your cravings...</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {view === 'auth' && (
        <div className="max-w-md mx-auto py-24 px-6">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100">
            <h2 className="text-3xl font-black mb-8 text-center">{authMode === 'login' ? 'Sign In' : 'Join Us'}</h2>
            <form onSubmit={handleAuth} className="space-y-6">
              {authMode === 'signup' && <input type="text" placeholder="Full Name" required className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />}
              <input type="email" placeholder="Email" required className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              <input type="password" placeholder="Access Key" required className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              {authError && <p className="text-red-500 text-xs font-bold text-center">{authError}</p>}
              <button type="submit" disabled={authLoading} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black hover:bg-indigo-600 transition-all flex justify-center">{authLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (authMode === 'login' ? 'Verify' : 'Register')}</button>
            </form>
            <div className="mt-8 text-center"><button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="text-sm font-bold text-indigo-600">{authMode === 'login' ? "Create Access Profile" : "Return to Login"}</button></div>
          </div>
        </div>
      )}

      {view === 'profile' && user && (
        <div className="max-w-5xl mx-auto px-6 py-24">
          <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-xl mb-12 flex items-center gap-10">
            <div className="w-32 h-32 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white text-5xl font-black">{user.name[0]}</div>
            <div><h2 className="text-5xl font-black mb-2">{user.name}</h2><p className="text-slate-500 text-xl font-medium">{user.email}</p></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2"><h3 className="text-3xl font-black mb-8">Order Logs</h3>{orders.map(o => <div key={o.id} className="bg-white p-8 rounded-3xl mb-4 border border-slate-100 flex justify-between items-center"><p className="font-black text-lg">#{o.id}</p><p className="text-2xl font-black">{CURRENCY}{o.total.toFixed(2)}</p></div>)}</div>
            <div className="bg-slate-950 p-8 rounded-[2.5rem] text-slate-400 h-fit">
              <p className="text-[10px] font-black uppercase text-indigo-400 mb-1">Status</p>
              <p className="text-white font-bold mb-6">AUTHENTICATED MEMBER</p>
              <p className="text-[9px] italic opacity-50">Handshake verified with Java Gateway Cluster node 4-B.</p>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
