import React, { useState } from "react";
import Header from "../components/header";
import Background from "../components/background";
import { GrAdd } from "react-icons/gr";
import MainContainer from "../components/mainContainer";
import ModalUsers from "../components/modalUsers"; // Certifique-se de que o caminho está correto

const Users: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSaveUser = (text: string) => {
        console.log("Novo usuário:", text);
        setIsModalOpen(false);
    };

    return (
        <div>
            <Header />
            <Background 
                text="Usuários"
                btn1={<GrAdd onClick={() => setIsModalOpen(true)} />}
            >
                <MainContainer
                    p1="Nome"
                    p2="Email"
                    p3="Cargo"
                    p6="Departamento"
                    content={undefined} 
                />
            </Background>
            <ModalUsers
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveUser}
            />
        </div>
    );
}

export default Users;
