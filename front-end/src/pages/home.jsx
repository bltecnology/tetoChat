import React, { useState } from "react";
import { Link } from 'react-router-dom';
import Header from '../components/header';
import ButtonCard from '../components/buttonCard';
import { FaComments, FaUserAlt, FaTags, FaChartBar, FaMobileAlt, FaRss } from 'react-icons/fa';
import TransmissionModal from "../components/modalTransmission";

const Home = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Função para abrir o modal de transmissão
    const openModal = () => {
        setIsModalOpen(true);
    };

    // Função para fechar o modal de transmissão
    const closeModal = () => {
        setIsModalOpen(false);
    };

    return (
        <div>
            <Header />
            <div className="bg-white min-h-screen flex flex-col justify-center items-center">
                <div className="flex justify-center items-center flex-col">
                    <div className="flex justify-center gap-24 col-span-3 w-full max-w-md mb-12">
                        <Link to="/chat">
                            <ButtonCard icon={<FaComments />} text="Conversas" />
                        </Link>
                        <Link to="/contacts">
                            <ButtonCard icon={<FaUserAlt />} text="Contatos" />
                        </Link>
                        <Link to="/departments">
                            <ButtonCard icon={<FaTags />} text="Departamentos" />
                        </Link>
                    </div>
                    
                </div>
            </div>

            
            <TransmissionModal isOpen={isModalOpen} onClose={closeModal} />
        </div>
    );
};

export default Home;
