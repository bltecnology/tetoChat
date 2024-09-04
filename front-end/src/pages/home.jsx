import React from "react";
import { Link } from 'react-router-dom';
import Header from '../components/header';
import ButtonCard from '../components/buttonCard';
import { FaComments, FaUserAlt, FaTags, FaChartBar, FaMobileAlt } from 'react-icons/fa';

const Home = () => {
    return (
        <div>
            <Header />
            <div className="bg-pink-100 min-h-screen flex flex-col justify-center items-center">
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
                    <div className="flex justify-center gap-24 items-center">
                        <Link to="/statistics" className="flex-1 mx-2">
                            <ButtonCard icon={<FaChartBar />} text="Estatísticas de Atendimento" />
                        </Link>

                        <Link to="/connectedDevices">
                            <ButtonCard icon={<FaMobileAlt />} text="Dispositivos conectados" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Home;
