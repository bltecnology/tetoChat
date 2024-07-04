import React from 'react';
import Header from '../components/header';
import Background from '../components/background';
import { GrAdd, GrFilter, GrRefresh } from 'react-icons/gr';
import MainContainer from '../components/mainContainer';

const Positions: React.FC = () => {
    return (
        <div>
            <Header />
            <Background 
                text='Cargos'
                btn1={<GrAdd />}
                btn2={<GrFilter />}
                btn3={<GrRefresh />}
            >
                <MainContainer 
                    p1='Nome'
                    p6='Ações'
                />
            </Background>
        </div>
    );
}

export default Positions;
