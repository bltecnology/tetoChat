import React, { ReactNode } from 'react';

interface ButtonCardProps {
  icon: ReactNode;
  text: string;
  className?: string;
}

const ButtonCard: React.FC<ButtonCardProps> = ({ icon, text }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center w-48 h-32">
      <div className="text-3xl mb-2 flex items-center justify-center">{icon}</div>
      <div
        className="text-xl font-medium ml-3 text-center"
        dangerouslySetInnerHTML={{ __html: text }}
      />
    </div>
  );
};

export default ButtonCard;
