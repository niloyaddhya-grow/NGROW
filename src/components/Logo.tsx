import React from 'react';
import { Leaf } from 'lucide-react';

export const Logo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <div className="absolute inset-0 bg-brand-primary/20 blur-xl rounded-full animate-pulse" />
      <div className="relative z-10 w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(14,165,233,0.4)] transform rotate-3 hover:rotate-0 transition-transform">
        <div className="relative">
          <Leaf className="text-brand-dark w-6 h-6 fill-current" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping" />
        </div>
      </div>
    </div>
  );
};
