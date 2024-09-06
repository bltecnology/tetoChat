import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from '../components/header';
import Background from '../components/background';
import { GrAdd, GrMoreVertical } from 'react-icons/gr';
import MainContainer from '../components/mainContainer';
import ModalDepartments from "../components/modalDepartments";

const Departments = () => {
    const [departments, setDepartments] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const response = await axios.get('https://tetochat-8m0r.onrender.com/departments');
                setDepartments(response.data);
            } catch (error) {
                console.error('Erro ao buscar departamentos:', error);
            }
        };

        fetchDepartments();
    }, []);

    const addDepartment = async (name) => {
        try {
            const response = await axios.post('https://tetochat-8m0r.onrender.com/departments', { name });
            setDepartments([...departments, response.data]);
            setIsModalOpen(false); // Fecha o modal após salvar
        } catch (error) {
            console.error('Erro ao salvar departamento:', error);
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
                                <div key={department.id} className="flex justify-between items-center border-b py-2">
                                    <div>{department.name}</div>
                                    <div><GrMoreVertical /></div>
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
}

export default Departments;
