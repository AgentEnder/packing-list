import { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
  return <div className="max-w-4xl mx-auto px-4 py-6">{children}</div>;
}
