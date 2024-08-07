import React, { useState } from 'react';
import Header from '../components/header';
import Background from '../components/background';
import { GrAdd, GrFilter, GrRefresh, GrMoreVertical } from 'react-icons/gr';
import MainContainer from '../components/mainContainer';
import Modal from '../components/modalPositions';

const Positions = () => {
    const [lines, setLines] = useState([
        { text: 'Administrador', icon: <GrMoreVertical /> }
    ]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const addLine = (text) => {
        setLines([...lines, { text, icon: <GrMoreVertical /> }]);
        setIsModalOpen(false);
    };

    return (
        <div>
            <Header />
            <Background 
                text='Cargos'
                btn1={<GrAdd onClick={() => setIsModalOpen(true)} />}
                btn2={<GrFilter />}
                btn3={<GrRefresh />}
            >
                <MainContainer 
                    p1='Nome'
                    p6='Ações'
                    content={
                        <div>
                            {lines.map((line, index) => (
                                <div key={index} className="flex justify-between items-center border-b py-2">
                                    <div>{line.text}</div>
                                    <div>{line.icon}</div>
                                </div>
                            ))}
                        </div>
                    }
                />
            </Background>
            <Modal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={addLine}
            />
        </div>
    );
}

export default Positions;
