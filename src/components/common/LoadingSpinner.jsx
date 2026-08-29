import React from 'react';

const LoadingSpinner = ({ message = 'Loading...', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div 
        className={`${sizeClasses[size]} rounded-full border-blue-200 border-t-blue-600 animate-spin`}
      ></div>
      {message && <p className="text-gray-500 text-sm font-medium">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
