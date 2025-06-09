import React from 'react';
import { FlowBackButton } from './FlowBackButton';

export interface PageHeaderProps {
  title: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-4 sm:mb-6">
      <h1 className="text-xl sm:text-2xl font-bold break-words min-w-0">
        {title}
      </h1>

      <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 min-w-0 w-full sm:w-auto justify-start sm:justify-end">
        {actions}
        <FlowBackButton />
      </div>
    </div>
  );
}
