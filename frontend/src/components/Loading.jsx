import React from 'react';

const Loading = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
      <div className="relative flex flex-col items-center">
        {/* Modern M Symbol Animation */}
        <div className="w-16 h-16 flex items-center justify-center relative">
          <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-black rounded-full border-t-transparent animate-spin"></div>
          <span className="text-2xl font-bold text-black animate-pulse">M</span>
        </div>
        <p className="mt-4 text-gray-500 font-medium tracking-wider">LOADING</p>
      </div>
    </div>
  );
};

export default Loading;
