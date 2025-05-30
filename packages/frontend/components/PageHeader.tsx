import React from 'react';

export interface PageHeaderProps {
  title: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <h1 className="text-3xl font-bold">{title}</h1>
      {actions && (
        <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
          {actions}
        </div>
      )}
    </div>
  );
}
