import React from 'react';

export interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({
  children,
  className = '',
}: PageContainerProps) {
  return (
    <div className={`container mx-auto px-4 py-6 ${className}`}>
      <div className="max-w-7xl mx-auto">{children}</div>
    </div>
  );
}
