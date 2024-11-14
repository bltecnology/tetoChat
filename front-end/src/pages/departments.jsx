import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/header";
import Background from "../components/background";
import { GrAdd, GrMoreVertical } from "react-icons/gr";
import MainContainer from "../components/mainContainer";
import ModalDepartments from "../components/modalDepartments";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@radix-ui/react-dropdown-menu';


const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get(
          "https://ec2-52-67-45-214.sa-east-1.compute.amazonaws.com/departments"
        );
        setDepartments(response.data);
      } catch (error) {
        console.error("Erro ao buscar departamentos:", error);
      }
    };

    fetchDepartments();
  }, []);

  const addDepartment = async (name) => {
    try {
      const response = await axios.post(
        "https://ec2-52-67-45-214.sa-east-1.compute.amazonaws.com/departments",
        { name }
      );
      setDepartments([...departments, response.data]);
      setIsModalOpen(false); // Fecha o modal após salvar
    } catch (error) {
      console.error("Erro ao salvar departamento:", error);
    }
  };

  const handleDeleteDepartment = async (departmentId) => {
    const confirmDelete = window.confirm(
      "Você realmente deseja excluir este Contato?"
    );
    if (confirmDelete) {
      try {
        await axios.delete(
          `https://ec2-52-67-45-214.sa-east-1.compute.amazonaws.com/departments/${departmentId}`
        );
        setDepartments(departments.filter((department) => department.id !== departmentId));
      } catch (error) {
        console.error("Erro ao excluir departamento:", error.message);
        alert(
          "Erro ao excluir o departamento. Verifique o console para mais detalhes."
        );
      }
    }
  };

  return (
    <div>
      <Header />
      <Background
        text="Departamentos"
        btn1={
          <GrAdd
            className="rounded-full hover:bg-gray-400 hover:scale-110 transition-transform transition-colors duration-300"
            onClick={() => setIsModalOpen(true)}
          />
        }
      >
        <MainContainer
          p1="Nome"
          p6="Ações"
          content={
            <div>
              {departments.map((department) => (
                <div
                  key={department.id}
                  className="flex justify-between items-center border-b py-2"
                >
                  <div>{department.name}</div>
                  <div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 rounded">
                          <GrMoreVertical className="cursor-pointer" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-white text-black mt-2 w-48">
                        <DropdownMenuItem className="hover:bg-gray-200 text-center">
                          <button onClick={() => (null)}>
                            Editar
                          </button>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="hover:bg-gray-200 text-center">
                          <button onClick={() => handleDeleteDepartment(department.id)}>
                            Excluir
                          </button>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          }
        />
      </Background>
      <ModalDepartments
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={addDepartment}
      />
    </div>
  );
};

export default Departments;
