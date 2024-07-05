import React from 'react';
import { Link } from 'react-router-dom';

import { FiEye, FiMenu, FiBell, FiUser } from 'react-icons/fi';

const Header: React.FC = () => {
  return (
    <div className="flex items-center justify-between p-4 bg-red-700 text-white">
      <div className="flex items-center">
        <div className="text-lg font-regular ml-8">TettoChat</div>
      </div>
      <div className="flex items-center">
        <div className="mr-8">
          <FiEye size={24} />
        </div>
        <div className="mr-8">
          <FiMenu size={24} />
        </div>
        <div className="mr-8">
          <FiBell size={24} />
        </div>
        <div className="mr-8">
          <Link to="/account">
            <FiUser size={24} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Header;
