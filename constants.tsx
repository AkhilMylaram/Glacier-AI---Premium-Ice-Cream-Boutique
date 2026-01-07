
import React from 'react';
import { IceCream, ShoppingCart, User, MessageSquare, Mic, Sparkles, ShieldCheck } from 'lucide-react';

export const APP_NAME = "Glacier AI";
export const CURRENCY = "$";

export const ICONS = {
  IceCream: <IceCream className="w-5 h-5" />,
  Cart: <ShoppingCart className="w-5 h-5" />,
  User: <User className="w-5 h-5" />,
  Chat: <MessageSquare className="w-5 h-5" />,
  Voice: <Mic className="w-5 h-5" />,
  AI: <Sparkles className="w-5 h-5" />,
  Sparkles: <Sparkles className="w-5 h-5" />,
  Secure: <ShieldCheck className="w-5 h-5 text-green-500" />
};

// Dynamic endpoint: Uses localhost for dev, but targets the Gateway port on the current host for EC2 production
export const GATEWAY_ENDPOINT = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
  ? "http://localhost:8080" 
  : `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:8080`;
