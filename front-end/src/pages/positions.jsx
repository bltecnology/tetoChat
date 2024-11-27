import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/header";
import Background from "../components/background";
import { GrAdd, GrRefresh, GrMoreVertical } from "react-icons/gr";
import MainContainer from "../components/mainContainer";
import Modal from "../components/modalPositions";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@radix-ui/react-dropdown-menu";

const Positions = () => {
  const [positions, setPositions] = useState([]); // Estado para armazenar os cargos
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para controle do modal
  const [editingPosition, setEditingPosition] = useState(null); // Estado para o cargo que está sendo editado

  // Função para buscar os cargos
  const fetchPositions = async () => {
    try {
      const response = await axios.get(
        "https://tetochat-backend.onrender.com/positions"
      );
      setPositions(response.data);
    } catch (error) {
      console.error("Erro ao buscar cargos:", error);
    }
  };

  // Executa o fetch ao montar o componente
  useEffect(() => {
    fetchPositions();
  }, []);

  // Função para adicionar novo cargo
  const addPosition = async (name) => {
    try {
      const response = await axios.post(
        "https://tetochat-backend.onrender.com/positions",
        { name }
      );

      // Atualiza a lista de cargos com o novo cargo retornado
      setPositions((prevPositions) => [...prevPositions, response.data]);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erro ao salvar cargo:", error);
    }
  };

  // Função para editar cargo
  const editPosition = async (positionId, newName) => {
    try {
      const response = await axios.put(
        `https://tetochat-backend.onrender.com/positions/${positionId}`,
        { name: newName }
      );

      console.log("Cargo atualizado com sucesso:", response.data);

      // Atualiza a lista de cargos após edição
      setPositions((prevPositions) =>
        prevPositions.map((position) =>
          position.id === positionId ? { ...position, name: newName } : position
        )
      );

      setIsModalOpen(false);
    } catch (error) {
      console.error("Erro ao editar cargo:", error);
      alert("Erro ao editar o cargo. Verifique o console para mais detalhes.");
    }
  };

  // Função para excluir cargo
  const handleDeletePosition = async (positionId) => {
    const confirmDelete = window.confirm(
      "Você realmente deseja excluir este Cargo?"
    );

    if (confirmDelete) {
      try {
        await axios.delete(
          `https://tetochat-backend.onrender.com/positions/${positionId}`
        );

        // Atualiza a lista de cargos após exclusão
        setPositions((prevPositions) =>
          prevPositions.filter((position) => position.id !== positionId)
        );

        alert("Cargo excluído com sucesso");
      } catch (error) {
        console.error("Erro ao excluir cargo:", error.message);
        alert(
          "Erro ao excluir o cargo. Verifique o console para mais detalhes."
        );
      }
    }
  };

  return (
    <div>
      <Header />
      <Background
        text="Cargos"
        btn1={
          <GrAdd
           
            onClick={() => setIsModalOpen(true)}
          />
        }
        btn3={<GrRefresh />} // Botão para atualizar a lista manualmente
      >
        <MainContainer
          p1="Nome"
          p6="Ações"
          content={
            <>
              {positions.map((position) => (

                <tr key={position.id} className="odd:bg-white 0 even:bg-gray-50 0 border-b ">
                  <td className="px-6 py-4">{position.name}</td>
                  <td className="px-6 py-4"> <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 rounded">
                        <GrMoreVertical className="cursor-pointer" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-white text-black mt-2 w-48">
                      <DropdownMenuItem className="hover:bg-gray-200 text-center">
                        <button
                          onClick={() => {
                            setEditingPosition(position); // Abre o modal para edição
                            setIsModalOpen(true);
                          }}
                        >
                          Editar
                        </button>
                      </DropdownMenuItem>

                      <DropdownMenuItem className="hover:bg-gray-200 text-center">
                        <button
                          onClick={() => handleDeletePosition(position.id)}
                        >
                          Excluir
                        </button>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu></td>
                </tr>


              ))}
            </>
          }
        />
      </Background>

      {/* Modal para adicionar ou editar cargo */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(newName) => {
          if (editingPosition) {
            editPosition(editingPosition.id, newName); // Corrigido: agora edita o cargo
          } else {
            addPosition(newName); // Caso não esteja editando, adiciona um novo cargo
          }
        }}
        initialValue={editingPosition ? editingPosition.name : ""}
      />
    </div>
  );
};

export default Positions;
