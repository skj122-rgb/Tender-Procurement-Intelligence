import React from 'react';

const Badge = ({ level, children }) => {
  const getBadgeClasses = (level) => {
    switch (level?.toUpperCase()) {
      case 'LOW':
        return 'bg-green-100 text-green-800 ring-green-600/20';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 ring-yellow-600/20';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 ring-orange-600/20';
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 ring-red-600/10';
      default:
        return 'bg-gray-100 text-gray-800 ring-gray-500/10';
    }
  };

  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getBadgeClasses(level)}`}>
      {children || level}
    </span>
  );
};

export default Badge;
