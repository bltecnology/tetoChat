import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/header";
import Background from "../components/background";
import { GrAdd, GrMoreVertical, GrRefresh } from "react-icons/gr";
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
          "https://tetochat-backend.onrender.com/departments"
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
        "https://tetochat-backend.onrender.com/departments",
        { name }
      );
      setDepartments([...departments, response.data]);
      setIsModalOpen(false); // Fecha o modal após salvar
    } catch (error) {
      console.error("Erro ao salvar departamento:", error);
    }
  };

  return (
    <div>
      <Header />
      <Background
        text="Departamentos"
        btn1={
          <GrAdd
           
            onClick={() => setIsModalOpen(true)}
          />
        }
        btn3={<GrRefresh />} 

      >
        <MainContainer
          p1="Nome"
          p2="Ações"
          content={
            <>
              {departments.map((department) => (

                <tr key={department.id} className="odd:bg-white 0 even:bg-gray-50 0 border-b ">
                  <td className="px-6 py-4">{department.name}</td>
                  <td className="px-6 py-4"><a href=""> Editar</a></td>
                </tr>

              ))}
            </>
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
