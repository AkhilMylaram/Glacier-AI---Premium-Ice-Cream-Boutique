
import React from 'react';
import { Product } from '../types';
import { CURRENCY, ICONS } from '../constants';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  return (
    <div className="bg-white rounded-[2rem] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(79,70,229,0.12)] transition-all duration-500 border border-slate-100 group flex flex-col h-full">
      <div className="relative h-72 overflow-hidden">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute top-6 left-6">
          <span className="bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 shadow-xl">
            {product.category}
          </span>
        </div>
      </div>
      
      <div className="p-8 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-4 gap-4">
          <h3 className="text-2xl font-black text-slate-900 leading-tight tracking-tight group-hover:text-indigo-600 transition-colors">{product.name}</h3>
          <span className="text-2xl font-black text-indigo-600 whitespace-nowrap">{CURRENCY}{product.price.toFixed(2)}</span>
        </div>
        <p className="text-slate-500 text-sm mb-6 leading-relaxed font-medium line-clamp-3">
          {product.description}
        </p>
        
        <div className="flex flex-wrap gap-2 mb-8 mt-auto">
          {product.tags.map(tag => (
            <span key={tag} className="bg-slate-50 text-slate-400 text-[10px] font-bold px-3 py-1 rounded-lg border border-slate-100 uppercase tracking-widest">
              {tag}
            </span>
          ))}
        </div>

        <button 
          onClick={() => onAddToCart(product)}
          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-indigo-600 shadow-xl shadow-slate-100 hover:shadow-indigo-200 transition-all active:scale-95 uppercase tracking-widest"
        >
          {ICONS.Cart} Add to Bag
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
