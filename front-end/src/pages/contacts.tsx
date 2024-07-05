import React, { useState } from 'react';
import Header from '../components/header';
import Background from '../components/background';
import { GrAdd, GrLinkTop } from 'react-icons/gr';
import MainContainer from '../components/mainContainer';

const Contacts: React.FC = () => {
    return(
        <div>
            <Header />
            <Background 
                text='Contatos'
                btn1={<GrAdd />}
                btn2={<GrLinkTop />}    
                 >
                <MainContainer
                 p1={'Nome'}
                 p3={'Número'}
                 p6={'Ações'}
                 content={undefined}                    
                />
            </Background>
        </div>
    );
}

export default Contacts;