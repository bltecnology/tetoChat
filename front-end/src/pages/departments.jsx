import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/header";
import Background from "../components/background";
import { GrAdd, GrMoreVertical, GrRefresh } from "react-icons/gr";
import MainContainer from "../components/mainContainer";
import ModalDepartments from "../components/modalDepartments";
import ModalEditDepartment from "../components/modalEditDepartments";

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

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
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Erro ao salvar departamento:", error);
    }
  };

  const updateDepartment = async (updatedDepartment) => {
    try {
      const response = await axios.put(
        `https://tetochat-backend.onrender.com/departments/${updatedDepartment.id}`,
        { name: updatedDepartment.name }
      );
      setDepartments(
        departments.map((dept) =>
          dept.id === updatedDepartment.id ? response.data : dept
        )
      );
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Erro ao atualizar departamento:", error);
    }
  };

  const openEditModal = (department) => {
    setSelectedDepartment(department);
    setIsEditModalOpen(true);
  };

  return (
    <div>
      <Header />
      <Background
        text="Departamentos"
        btn1={
          <GrAdd onClick={() => setIsAddModalOpen(true)} />
        }
        btn3={<GrRefresh />}
      >
        <MainContainer
          p1="Nome"
          p2="Ações"
          content={
            <>
              {departments.map((department) => (
                <tr key={department.id} className="odd:bg-white 0 even:bg-gray-50 0 border-b">
                  <td className="px-6 py-4">{department.name}</td>
                  <td className="px-6 py-4">
                    <a
                      href="#"
                      className="text-blue-500 hover:underline"
                      onClick={() => openEditModal(department)}
                    >
                      Editar
                    </a>
                  </td>
                </tr>
              ))}
            </>
          }
        />
      </Background>
      <ModalDepartments
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={addDepartment}
      />
      <ModalEditDepartment
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={updateDepartment}
        department={selectedDepartment}
      />
    </div>
  );
};

export default Departments;
