import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from '../components/header';
import Background from '../components/background';
import { GrAdd, GrMoreVertical, GrRefresh } from 'react-icons/gr';
import MainContainer from '../components/mainContainer';
import ModalQuickResponses from "../components/modalQuickResponses";

const QuickResponses = () => {
    const [quickResponses, setQuickResponses] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchQuickResponses = async () => {
            try {
                const response = await axios.get('https://tetochat-backend.onrender.com/quickResponses', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });
                const departament = response.data
                const filterDepartament = departament.filter((departament) => departament.name === localStorage.department)
                setQuickResponses(filterDepartament);
            } catch (error) {
                console.error('Erro ao buscar respostas rápidas:', error);
            }
        };

        fetchQuickResponses();
    }, []);

    const addQuickResponse = async (text, department) => {
        try {
            const response = await axios.post('https://tetochat-backend.onrender.com/quickresponses', { text, department }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            setQuickResponses([...quickResponses, response.data]);
            setIsModalOpen(false);
        } catch (error) {
            console.error('Erro ao salvar resposta rápida:', error);
        }
    };

    return (
        <div>
            <Header />
            <Background
                text="Respostas Rápidas"
                btn1={<GrAdd onClick={() => setIsModalOpen(true)} />}
                btn3={<GrRefresh />}
            >
                <MainContainer
                    p1="Mensagem"
                    p2="Departamento"
                    p3="Ações"
                    content={
                        <>
                            {quickResponses.map((response) => {
                                console.log(response);

                                return (
                                    <tr key={response.id} className="odd:bg-white 0 even:bg-gray-50 0 border-b ">
                                        <td className="px-6 py-4">{response.text}</td>
                                        <td className="px-6 py-4">{response.name}</td>
                                        <td className="px-6 py-4"><GrMoreVertical /></td>
                                    </tr>
                                )
                            })}
                        </>
                    }
                />
            </Background>
            <ModalQuickResponses
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={addQuickResponse}
            />
        </div>
    )
}

export default QuickResponses;
