import React from 'react';

const ButtonCard = ({ icon, text, className }) => {
  return (
    <div className={`bg-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center w-48 h-32 ${className}`}>
      <div className="text-3xl mb-2 flex items-center justify-center">{icon}</div>
      <div
        className="text-xl font-medium ml-3 text-center"
        dangerouslySetInnerHTML={{ __html: text }}
      />
    </div>
  );
};

export default ButtonCard;
