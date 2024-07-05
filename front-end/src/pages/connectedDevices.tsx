import React from "react";
import Header from '../components/header';
import Background from '../components/background';
import { GrAdd } from 'react-icons/gr';

const ConnectedDevices: React.FC = () => {
    return(
        <div>
            <Header />
            <Background
                text="Conexões"
                btn1={<GrAdd />}
                children = 
                {<div className="bg-black flex">
                    
                </div>}
                >
            </Background>
        </div>
    )
}

export default ConnectedDevices;