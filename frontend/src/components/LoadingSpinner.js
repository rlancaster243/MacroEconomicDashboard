import React from 'react';

const LoadingSpinner = ({ message = 'Loading data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-700 mb-4"></div>
      <p className="text-indigo-700 font-semibold">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
