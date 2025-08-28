"use client";

import React from 'react';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
  container?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export default function ResponsiveLayout({ 
  children, 
  className = "", 
  container = true,
  maxWidth = '2xl'
}: ResponsiveLayoutProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  };

  return (
    <div className={`
      ${container ? 'responsive-container' : ''} 
      ${maxWidthClasses[maxWidth]}
      ${className}
    `}>
      {children}
    </div>
  );
}
