import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiEye, FiMenu, FiBell, FiUser } from "react-icons/fi";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@radix-ui/react-dropdown-menu";
import axios from "axios";

import { useEffect } from "react";


const Header = () => {

  return (
    <div className="flex items-center justify-between p-1 bg-red-700 text-white">
      <div className="flex items-center">
        <Link to="/home">
          <div className="text-lg font-regular ml-8">TetoChat</div>
        </Link>
      </div>
      <div className="flex items-center">
        <div className="mr-8">
          <FiEye size={24} className="hover:rotate-y-360" />
        </div>
        <div className="relative mr-8">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className=" p-2 rounded">
                <FiMenu size={24} className="hover:rotate-y-360 " />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-slate-100 rounded-lg text-black mt-2 w-48">
              <DropdownMenuItem className="hover:bg-gray-200 text-center">
                <Link to="/users">Usuários</Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-gray-200 text-center">
                <Link to="/positions">Cargos</Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-gray-200 text-center">
                <Link to="/robots">Robôs</Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-gray-200 text-center">
                <Link to="/quickResponses">Respostas Rápidas</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="mr-8">
          <FiBell size={24} className="hover:rotate-y-360" />
        </div>
        <div className="mr-8">
          <Link to="/account">
            <FiUser size={24} className="hover:rotate-y-360" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Header;
