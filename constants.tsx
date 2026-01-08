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

// Target the Go API Gateway (8080)
export const GATEWAY_ENDPOINT = "http://localhost:8080";