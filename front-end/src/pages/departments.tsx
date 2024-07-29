import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from '../components/header';
import Background from '../components/background';
import { GrAdd, GrMoreVertical } from 'react-icons/gr';
import MainContainer from '../components/mainContainer';
import ModalDepartments from "../components/modalDepartments";

interface Department {
    id: number;
    name: string;
}

const Departments: React.FC = () => {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const response = await axios.get('http://localhost:3005/departments');
                setDepartments(response.data);
            } catch (error) {
                console.error('Erro ao buscar departamentos:', error);
            }
        };

        fetchDepartments();
    }, []);

    const addDepartment = async (name: string) => {
        try {
            const response = await axios.post('http://localhost:3005/departments', { name });
            setDepartments([...departments, response.data]);
            setIsModalOpen(false);
        } catch (error) {
            console.error('Erro ao salvar departamento:', error);
        }
    };

    return (
        <div>
            <Header />
            <Background
                text="Departamentos"
                btn1={<GrAdd onClick={() => setIsModalOpen(true)} />}
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
