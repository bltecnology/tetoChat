import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/header";
import Background from "../components/background";
import { GrAdd, GrFilter, GrRefresh, GrMoreVertical } from "react-icons/gr";
import MainContainer from "../components/mainContainer";
import Modal from "../components/modalPositions";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@radix-ui/react-dropdown-menu";

const Positions = () => {
  const [positions, setPositions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const response = await axios.get(
          "https://tetochat-8m0r.onrender.com/positions"
        );
        setPositions(response.data);
      } catch (error) {
        console.error("Erro ao buscar cargos:", error);
      }
    };

    fetchPositions();
  }, []);

  const addPosition = async (name) => {
    try {
      const response = await axios.post(
        "https://tetochat-8m0r.onrender.com/positions",
        { name }
      );
      setPositions([...positions, response.data]);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erro ao salvar cargo:", error);
    }
  };

  const handleDeletePosition = async (positionId) => {
    const confirmDelete = window.confirm(
      "Você realmente deseja excluir este Cargo?"
    );
    if (confirmDelete) {
      try {
        await axios.delete(
          `https://tetochat-8m0r.onrender.com/positions/${positionId}`
        );
        setPositions(
          positions.filter((position) => position.id !== positionId)
        );
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
            className="rounded-full hover:bg-gray-400 hover:scale-110 transition-transform transition-colors duration-300"
            onClick={() => setIsModalOpen(true)}
          />
        }
        btn2={<GrFilter />}
        btn3={<GrRefresh />}
      >
        <MainContainer
          p1="Nome"
          p6="Ações"
          content={
            <div>
              {positions.map((position) => (
                <div
                  key={position.id}
                  className="flex justify-between items-center border-b py-2"
                >
                  <div>{position.name}</div>
                  <div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 rounded">
                          <GrMoreVertical className="cursor-pointer" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-white text-black mt-2 w-48">
                        <DropdownMenuItem className="hover:bg-gray-200 text-center">
                          <button onClick={() => null}>Editar</button>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="hover:bg-gray-200 text-center">
                          <button
                            onClick={() =>
                              handleDeletePosition(position.id)
                            }
                          >
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
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={addPosition}
      />
    </div>
  );
};

export default Positions;
