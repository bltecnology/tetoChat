import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/header";
import Background from "../components/background";
import { GrAdd, GrMoreVertical, GrRefresh } from "react-icons/gr";
import MainContainer from "../components/mainContainer";
import ModalQuickResponses from "../components/modalQuickResponses";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@radix-ui/react-dropdown-menu";
import ModalEditQuickResponse from "../components/ModalEditQuickResponse";

const QuickResponses = () => {
    const [quickResponses, setQuickResponses] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedQuickResponse, setSelectedQuickResponse] = useState(null);

    const fetchQuickResponses = async () => {
        try {
            const response = await axios.get(
                "https://tetochat-backend.onrender.com/quickResponses",
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );
            const departament = response.data;
            const filterDepartament = departament.filter(
                (departament) => departament.name === localStorage.department
            );
            setQuickResponses(filterDepartament);
        } catch (error) {
            console.error("Erro ao buscar respostas rápidas:", error);
        }
    };

    useEffect(() => {
        fetchQuickResponses();
    }, []);

    const addQuickResponse = async (text, department) => {
        try {
            const response = await axios.post(
                "https://tetochat-backend.onrender.com/quickresponses",
                { text, department },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );
            setQuickResponses([...quickResponses, response.data]);
            setIsModalOpen(false);
        } catch (error) {
            console.error("Erro ao salvar resposta rápida:", error);
        }
    };

    const handleEditQuickResponse = (response) => {
        setSelectedQuickResponse(response);
        setIsEditModalOpen(true);
    };

    const saveEditedQuickResponse = () => {
        fetchQuickResponses();
        setIsEditModalOpen(false);
    };

    return (
        <div>
            <Header />
            <Background
                text="Respostas Rápidas"
                btn1={<GrAdd onClick={() => setIsModalOpen(true)} />}
                btn3={<GrRefresh onClick={fetchQuickResponses} />}
            >
                <MainContainer
                    p1="Mensagem"
                    p2="Departamento"
                    p3="Ações"
                    content={
                        <>
                            {quickResponses.map((response) => (
                                <tr
                                    key={response.id}
                                    className="odd:bg-white even:bg-gray-50 border-b"
                                >
                                    <td className="px-6 py-4">{response.text}</td>
                                    <td className="px-6 py-4">{response.name}</td>
                                    <td className="px-6 py-4">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="p-2 rounded">
                                                    <GrMoreVertical className="cursor-pointer" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="bg-white text-black mt-2 w-48">
                                                <DropdownMenuItem className="hover:bg-gray-200 text-center">
                                                    <button
                                                        onClick={() => handleEditQuickResponse(response)}
                                                    >
                                                        Editar
                                                    </button>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                        </>
                    }
                />
            </Background>
            <ModalQuickResponses
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={addQuickResponse}
            />
            <ModalEditQuickResponse
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={saveEditedQuickResponse}
                quickResponse={selectedQuickResponse}
            />
        </div>
    );
};

export default QuickResponses;
