import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  changeType?: 'positive' | 'negative';
  color: 'blue' | 'pink' | 'green';
  subtitle?: string;
  onClick?: () => void;
}

const colorClasses = {
  blue: 'border-blue-400 bg-blue-50',
  pink: 'border-pink-400 bg-pink-50',
  green: 'border-green-400 bg-green-50',
};

const iconColorClasses = {
  blue: 'text-blue-600',
  pink: 'text-pink-600',
  green: 'text-green-600',
};

export default function StatCard({
  title,
  value,
  icon,
  change,
  changeType = 'positive',
  color,
  subtitle,
  onClick,
}: StatCardProps) {
  const Component = onClick ? 'button' : 'div';

return (
  <Component
    onClick={onClick}
    className={`rounded-lg border-l-4 ${colorClasses[color]} p-6 shadow-md transition-all duration-200 hover:bg-pink-50 ${
      onClick ? 'cursor-pointer hover:shadow-lg' : ''
    }`}
  >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-600 text-sm font-semibold uppercase tracking-wider antialiased">
            {title}
          </p>
          <p className="text-3xl font-extrabold text-gray-800 mt-2 antialiased">
            {value}
          </p>
          {subtitle && (
            <p className={`text-sm mt-1 font-medium antialiased ${
              changeType === 'positive' ? 'text-green-600' : 'text-red-600'
            }`}>
              {subtitle}
            </p>
          )}
          {change && (
            <p className={`text-sm mt-2 font-semibold antialiased ${
              changeType === 'positive' ? 'text-green-600' : 'text-red-600'
            }`}>
              {changeType === 'positive' ? '↑' : '↓'} {change}
            </p>
          )}
        </div>
        <div className={`text-2xl ${iconColorClasses[color]}`}>{icon}</div>
      </div>
    </Component>
  );
}