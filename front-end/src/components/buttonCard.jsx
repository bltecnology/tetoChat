import React from 'react';

const ButtonCard = ({ icon, text, className }) => {
  return (
    <div>
      <button
        className={`relative inline-flex items-center justify-center p-6 overflow-hidden font-medium transition-all bg-red-200 text-red-500 rounded-xl group w-48 h-32 ${className}`}
      >
        <span className="absolute inset-0 w-full h-full transition-all duration-500 ease-in-out bg-red-600 rounded-2xl group-hover:scale-100 scale-0"></span>
        <span className="relative z-10 flex flex-col items-center justify-center text-red-500 transition-colors duration-200 ease-in-out group-hover:text-white">
          <div className="text-3xl mb-2">{icon}</div>
          <div className="text-xl font-medium text-center leading-tight">{text}</div>
        </span>
      </button>
    </div>
  );
};

export default ButtonCard;
