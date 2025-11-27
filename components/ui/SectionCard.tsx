import React, { ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  icon?: ReactNode;
}

export const SectionCard: React.FC<SectionCardProps> = ({ title, subtitle, children, icon }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 transition-all hover:shadow-md">
      <div className="bg-institutional/5 p-4 border-b border-institutional/10 flex items-center gap-3">
        {icon && <div className="text-institutional">{icon}</div>}
        <div>
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};