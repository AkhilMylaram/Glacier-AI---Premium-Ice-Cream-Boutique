import React, { useState } from 'react';
import { Product } from '../types';
import { CURRENCY, ICONS } from '../constants';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // High-quality fallback: Toasted Black Sesame Ice Cream
  const fallbackImage = "https://images.unsplash.com/photo-1560008511-11c63416e52d?auto=format&fit=crop&q=80&w=800";

  return (
    <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_25px_60px_rgba(79,70,229,0.15)] transition-all duration-700 border border-slate-100 group flex flex-col h-full">
      <div className="relative h-80 overflow-hidden bg-slate-50">
        {/* Loading Spinner */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50">
            <div className="animate-spin text-indigo-400 mb-4 scale-125 opacity-40">
              {ICONS.IceCream}
            </div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300">Fetching Asset...</p>
          </div>
        )}
        
        <img 
          src={imageError ? fallbackImage : product.imageUrl} 
          alt={product.name} 
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          className={`w-full h-full object-cover transition-all duration-1000 ease-out ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'} group-hover:scale-110`}
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="absolute top-6 left-6 flex flex-col gap-2">
          <span className="bg-white/90 backdrop-blur-xl px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 shadow-xl border border-white/50">
            {product.category}
          </span>
          {product.inventory < 15 && (
            <span className="bg-orange-500/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-white shadow-lg animate-pulse">
              Limited Batch
            </span>
          )}
        </div>

        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
          <div className="bg-indigo-600 text-white p-4 rounded-2xl shadow-2xl">
            {ICONS.AI}
          </div>
        </div>
      </div>
      
      <div className="p-8 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-4 gap-4">
          <div className="max-w-[70%]">
            <h3 className="text-2xl font-black text-slate-900 leading-[1.1] tracking-tight group-hover:text-indigo-600 transition-colors mb-1">{product.name}</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Archival Entry #{product.id.toUpperCase()}</p>
          </div>
          <span className="text-3xl font-black text-indigo-600 whitespace-nowrap drop-shadow-sm">{CURRENCY}{product.price.toFixed(2)}</span>
        </div>
        
        <p className="text-slate-500 text-sm mb-6 leading-relaxed font-medium line-clamp-2 italic">
          "{product.description}"
        </p>
        
        <div className="flex flex-wrap gap-2 mb-8 mt-auto">
          {product.tags.map(tag => (
            <span key={tag} className="bg-slate-100/50 text-slate-500 text-[9px] font-bold px-3 py-1.5 rounded-lg border border-slate-200/50 uppercase tracking-widest">
              {tag}
            </span>
          ))}
        </div>

        <button 
          onClick={() => onAddToCart(product)}
          className="w-full bg-slate-950 text-white py-5 rounded-[1.5rem] font-black text-sm flex items-center justify-center gap-3 hover:bg-indigo-600 shadow-2xl shadow-slate-200 hover:shadow-indigo-300 transition-all active:scale-[0.97] uppercase tracking-widest group/btn overflow-hidden relative"
        >
          <span className="relative z-10 flex items-center gap-3">
            <span className="group-hover/btn:rotate-12 transition-transform">{ICONS.Cart}</span>
            Synthesize to Bag
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-700 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
        </button>
      </div>
    </div>
  );
};

export default ProductCard;