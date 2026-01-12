
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Layout from './components/Layout';
import ProductCard from './components/ProductCard';
import { Product, CartItem, User, Order, OrderStatus } from './types';
import { gateway } from './services/apiGateway';
import { getFlavorRecommendation, connectVoiceAssistant } from './services/geminiService';
import { encode, decode, decodeAudioData } from './services/audioUtils';
import { ICONS, CURRENCY } from './constants';
import { MicOff, Volume2, X, ShoppingBag, CreditCard, ChevronRight } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'menu' | 'ai' | 'auth' | 'profile'>('home');
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
  const [authError, setAuthError] = useState<string | null>(null);
  
  // AI State
  const [aiMode, setAiMode] = useState<'text' | 'voice'>('text');
  const [textPrompt, setTextPrompt] = useState('');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  
  // Audio Refs
  const audioContextRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const voiceSessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Form State
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const res = await gateway.request<Product[]>('catalog', '/list');
    if (res.data) setProducts(res.data);
    setLoading(false);
  }, []);

  const fetchOrders = useCallback(async (userId: string) => {
    const res = await gateway.request<Order[]>('catalog', '/order/my-orders', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
    if (res.data) setOrders(res.data);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const navigateTo = (v: any) => {
    if (!user && (v === 'profile' || v === 'ai')) {
      setAuthMode('login');
      setView('auth');
      return;
    }
    if (v === 'profile' && user) fetchOrders(user.id);
    setView(v);
    setAuthError(null);
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

      // Re-initialize for next-start-time
      nextStartTimeRef.current = audioContextRef.current.output.currentTime;

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
            
            sessionPromise.then(session => {
              if (session) session.sendRealtimeInput({ media: pcmBlob });
            });
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
    
    // Format items for the new API
    const orderItems = cart.map(item => ({
      productId: item.id,
      quantity: item.quantity
    }));

    const res = await gateway.request<Order>('catalog', '/order', {
      method: 'POST',
      body: JSON.stringify({ 
        userId: user.id, 
        items: orderItems,
        paymentMethod: 'card',
        notes: 'Online order from Glacier AI'
      })
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
        <p className="text-indigo-200/50 font-black uppercase tracking-[0.4em] animate-pulse text-[10px]">Initializing Sensory Core</p>
      </div>
    );
  }

  return (
    <Layout 
      user={user} 
      cartCount={cart.reduce((acc, i) => acc + i.quantity, 0)} 
      onNavigate={navigateTo} 
      onOpenCart={() => setIsCartOpen(true)}
      onSignOut={handleSignOut}
    >
      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsCartOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2 rounded-xl text-white">{ICONS.Cart}</div>
                <h2 className="text-3xl font-black text-slate-900">Your Selection</h2>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-8 space-y-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                    <ShoppingBag className="w-10 h-10" />
                  </div>
                  <div>
                    <p className="text-slate-900 font-bold">Your bag is empty</p>
                    <p className="text-slate-400 text-sm">Discover our artisanal flavors.</p>
                  </div>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between">
                        <h4 className="font-bold text-slate-900">{item.name}</h4>
                        <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-slate-500">{item.quantity} x {CURRENCY}{item.price.toFixed(2)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-8 border-t border-slate-100 bg-slate-50/50">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Total Synthesis</span>
                  <span className="text-2xl font-black text-indigo-600">{CURRENCY}{cartTotal.toFixed(2)}</span>
                </div>
                <button 
                  onClick={handleCheckout}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-xl active:scale-95"
                >
                  <CreditCard className="w-5 h-5" />
                  Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {view === 'home' && (
          <div className="space-y-20 py-10">
            <div className="text-center space-y-8 max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full text-indigo-600 text-xs font-black uppercase tracking-widest mb-4">
                {ICONS.Sparkles} Next-Gen Artisanal Creamery
              </div>
              <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tight leading-[0.9]">
                Neural <span className="text-indigo-600">Scoops.</span><br />Digital Bliss.
              </h1>
              <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
                Experience the fusion of molecular gastronomy and generative intelligence. 
                Every batch is synthesized for peak sensory satisfaction.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <button onClick={() => setView('menu')} className="w-full sm:w-auto px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-2xl">
                  Explore Mesh
                </button>
                <button onClick={() => setView('ai')} className="w-full sm:w-auto px-10 py-5 bg-white text-slate-900 border border-slate-200 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-3">
                  {ICONS.AI} Flavor Consult
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-12">
              {products.slice(0, 3).map(product => (
                <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
              ))}
            </div>
          </div>
        )}

        {view === 'menu' && (
          <div className="py-10">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
              <div>
                <h2 className="text-5xl font-black text-slate-900 mb-4 tracking-tight">The Inventory</h2>
                <p className="text-slate-500 font-medium">Browse our seasonally curated selection of artisanal frozen textures.</p>
              </div>
              <div className="flex gap-2">
                {['Classic', 'Signature', 'Vegan', 'Limited'].map(cat => (
                  <button key={cat} className="px-5 py-2.5 rounded-full text-xs font-bold border border-slate-200 hover:border-indigo-600 hover:text-indigo-600 transition-all uppercase tracking-widest">
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map(product => (
                <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
              ))}
            </div>
          </div>
        )}

        {view === 'ai' && (
          <div className="max-w-5xl mx-auto py-10">
            <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
              <div className="bg-slate-900 p-12 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] -mr-48 -mt-48" />
                <div className="relative z-10 space-y-6">
                  <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl">
                    {ICONS.AI}
                  </div>
                  <h2 className="text-5xl font-black tracking-tight">Sensory Concierge</h2>
                  <p className="text-indigo-200/60 max-w-xl text-lg font-medium leading-relaxed">
                    Our advanced model will analyze your current cravings to synthesize the perfect flavor profile.
                  </p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setAiMode('text')}
                      className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${aiMode === 'text' ? 'bg-indigo-600 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                    >
                      Neural Query
                    </button>
                    <button 
                      onClick={() => setAiMode('voice')}
                      className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${aiMode === 'voice' ? 'bg-indigo-600 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                    >
                      Audio Stream
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-12">
                {aiMode === 'text' ? (
                  <div className="space-y-12">
                    <div className="relative">
                      <textarea 
                        value={textPrompt}
                        onChange={(e) => setTextPrompt(e.target.value)}
                        placeholder="Tell me about your mood, recent meals, or favorite colors..."
                        className="w-full bg-slate-50 border-none rounded-[2rem] p-8 text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-100 transition-all min-h-[160px] text-lg font-medium resize-none shadow-inner"
                      />
                      <button 
                        onClick={askAI}
                        disabled={aiLoading || !textPrompt.trim()}
                        className="absolute bottom-6 right-6 bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
                      >
                        {aiLoading ? 'Synthesizing...' : 'Generate Prediction'}
                      </button>
                    </div>

                    {aiResponse && (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="bg-indigo-50/50 rounded-[2.5rem] p-10 border border-indigo-100 flex flex-col md:flex-row gap-10">
                          <div className="bg-white p-2 rounded-3xl shadow-xl flex-shrink-0 w-48 h-48 border border-indigo-100 overflow-hidden">
                            <div className="w-full h-full rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-5xl">
                              {ICONS.IceCream}
                            </div>
                          </div>
                          <div className="space-y-6">
                            <div>
                              <h4 className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] mb-2">Optimal Vector</h4>
                              <h3 className="text-4xl font-black text-slate-900 leading-tight">{aiResponse.flavor}</h3>
                            </div>
                            <p className="text-slate-600 text-lg leading-relaxed font-medium italic">"{aiResponse.reason}"</p>
                            <div className="flex flex-wrap gap-2">
                              {aiResponse.adjectives?.map((adj: string) => (
                                <span key={adj} className="bg-white text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100 shadow-sm">
                                  {adj}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 space-y-12 text-center">
                    <div className="relative">
                      <div className={`absolute inset-0 bg-indigo-500 rounded-full blur-3xl opacity-20 transition-all duration-1000 ${isVoiceActive ? 'scale-150 animate-pulse' : 'scale-0'}`} />
                      <button 
                        onClick={isVoiceActive ? stopVoiceSession : startVoiceSession}
                        className={`relative z-10 w-40 h-40 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl active:scale-90 ${isVoiceActive ? 'bg-red-500 text-white scale-110' : 'bg-slate-900 text-white hover:bg-indigo-600'}`}
                      >
                        {isVoiceActive ? <MicOff className="w-12 h-12" /> : <div className="scale-[2.5]">{ICONS.Voice}</div>}
                      </button>
                    </div>
                    
                    <div className="space-y-4 max-w-sm">
                      <h3 className="text-2xl font-black text-slate-900">{isVoiceActive ? 'Streaming Real-time Interface' : 'Voice-Activated Sync'}</h3>
                      <p className="text-slate-500 font-medium">
                        {isVoiceActive 
                          ? "I'm listening. Describe your sensory preferences." 
                          : "Click to establish a neural voice link with our sensory concierge."}
                      </p>
                    </div>

                    {isVoiceActive && (
                      <div className="flex items-center gap-2 bg-indigo-50 px-6 py-3 rounded-full text-indigo-600">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className={`w-1 bg-indigo-600 rounded-full animate-bounce`} style={{ height: `${Math.random() * 20 + 10}px`, animationDelay: `${i * 0.1}s` }} />
                          ))}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Processing Audio Flux</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {view === 'auth' && (
          <div className="max-w-md mx-auto py-20">
            <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 border border-slate-100">
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl text-white mb-6 shadow-xl">
                  {ICONS.User}
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-2">Access Portal</h2>
                <p className="text-slate-500 font-medium">Establish your identity in the Glacier Mesh.</p>
              </div>

              <form onSubmit={handleAuth} className="space-y-6">
                {authMode === 'signup' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                      placeholder="John Doe"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Email Protocol</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    placeholder="user@network.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Access Key</label>
                  <input 
                    type="password" 
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    placeholder="••••••••"
                  />
                </div>

                {authError && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">
                    {authError}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={authLoading}
                  className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {authLoading ? 'Verifying...' : authMode === 'login' ? 'Authorize' : 'Initialize Profile'}
                </button>
              </form>

              <div className="mt-8 text-center">
                <button 
                  onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                  className="text-indigo-600 text-sm font-bold hover:underline"
                >
                  {authMode === 'login' ? "Need a new profile? Initialize here" : "Already registered? Authenticate here"}
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'profile' && user && (
          <div className="max-w-5xl mx-auto py-10 space-y-12">
            <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-slate-100 flex flex-col md:flex-row items-center gap-10">
              <div className="w-32 h-32 rounded-[2.5rem] bg-indigo-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl">
                {user.name?.[0]}
              </div>
              <div className="flex-grow text-center md:text-left">
                <h2 className="text-4xl font-black text-slate-900 mb-2">{user.name}</h2>
                <p className="text-slate-500 font-medium mb-4">{user.email}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                  <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status: Verified</span>
                  </div>
                  <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Role: {user.role}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <h3 className="text-3xl font-black text-slate-900">Transaction History</h3>
              <div className="space-y-4">
                {orders.length === 0 ? (
                  <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-100 border-dashed">
                    <p className="text-slate-400 font-medium">No previous transactions found in the ledger.</p>
                  </div>
                ) : (
                  orders.map(order => (
                    <div key={order.id} className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 group hover:shadow-xl transition-all">
                      <div className="flex items-center gap-6">
                        <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          <ShoppingBag className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">TX-ID: {order.id}</p>
                          <p className="text-lg font-bold text-slate-900">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Settlement</p>
                          <p className="text-xl font-black text-indigo-600">{CURRENCY}{order.total.toFixed(2)}</p>
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          order.status === OrderStatus.COMPLETED ? 'bg-green-100 text-green-700' :
                          order.status === OrderStatus.PENDING ? 'bg-amber-100 text-amber-700' :
                          'bg-indigo-100 text-indigo-700'
                        }`}>
                          {order.status}
                        </span>
                        <ChevronRight className="w-5 h-5 text-slate-300" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default App;
