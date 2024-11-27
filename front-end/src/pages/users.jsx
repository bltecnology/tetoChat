import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/header";
import Background from "../components/background";
import { GrAdd, GrMoreVertical, GrRefresh } from "react-icons/gr";

import MainContainer from "../components/mainContainer";
import ModalUsers from "../components/modalUsers";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@radix-ui/react-dropdown-menu';

const Users = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);

  const handleSaveUser = (user) => {
    if (editingUser) {
      setUsers(users.map(u => u.id === user.id ? user : u));
    } else {
      setUsers([...users, user]);
    }
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (userId) => {
    const confirmDelete = window.confirm("Você realmente deseja excluir este usuário?");
    if (confirmDelete) {
      try {
        await axios.delete(`https://tetochat-pgus.onrender.com/users/${userId}`);
        setUsers(users.filter(user => user.id !== userId));
      } catch (error) {
        console.error('Erro ao excluir usuário:', error.message);
        alert('Erro ao excluir o usuário. Verifique o console para mais detalhes.');
      }
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('https://tetochat-pgus.onrender.com/users');
        console.log(response.data);  // Log the response
        setUsers(response.data);
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div>
      <Header />
      <Background
        text="Usuários"
        btn1={<GrAdd 
          onClick={() => setIsModalOpen(true)} />
        }
        btn3={<GrRefresh />}

      >
        <MainContainer
          p1="Nome"
          p2="Email"
          p3="Cargo"
          p4="Departamento"
          p6="Ações"
          content={
            <>
              {users.map((user) => (
                <tr key={user.id} className="odd:bg-white 0 even:bg-gray-50 0 border-b ">
                  <td className="px-6 py-4">{user.name}</td>
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4">{user.position || user.cargo}</td>
                  <td className="px-6 py-4">{user.department || user.departamento}</td>

                  <td className="px-6 py-4"> <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 rounded">
                        <GrMoreVertical className="cursor-pointer" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-white text-black mt-2 w-48">
                      <DropdownMenuItem className="hover:bg-gray-200 text-center">
                        <button onClick={() => handleEditUser(user)}>Editar</button>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu></td>
                </tr>
              ))}
            </>
          }
        />
      </Background>
      <ModalUsers
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUser(null);
        }}
        onSave={handleSaveUser}
        user={editingUser}
      />
    </div>
  );
}

export default Users;
