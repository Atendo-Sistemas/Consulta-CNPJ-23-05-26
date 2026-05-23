import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  color?: 'blue' | 'green' | 'red' | 'purple' | 'orange';
}

const colorClasses = {
  blue: 'bg-blue-50 border-blue-200 text-blue-600',
  green: 'bg-green-50 border-green-200 text-green-600',
  red: 'bg-red-50 border-red-200 text-red-600',
  purple: 'bg-purple-50 border-purple-200 text-purple-600',
  orange: 'bg-orange-50 border-orange-200 text-orange-600',
};

const iconColorClasses = {
  blue: 'text-blue-400',
  green: 'text-green-400',
  red: 'text-red-400',
  purple: 'text-purple-400',
  orange: 'text-orange-400',
};

export default function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'blue',
}: StatsCardProps) {
  return (
    <div className={`p-6 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-2">{subtitle}</p>}
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <span
                className={`text-sm font-medium ${
                  trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.direction === 'up' ? '↑' : '↓'} {trend.value}%
              </span>
            </div>
          )}
        </div>
        {icon && <div className={`text-3xl ${iconColorClasses[color]}`}>{icon}</div>}
      </div>
    </div>
  );
}
