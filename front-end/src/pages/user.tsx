import React from "react";
import Header from "../components/header";
import Background from "../components/background";
import { GrAdd, } from "react-icons/gr";
import MainContainer from "../components/mainContainer";

const Users: React.FC = () => {
    return (
        <div>
            <Header />
            <Background 
                text="Usuários"
                btn1={<GrAdd/>}
                >
                <MainContainer
                p1="Nome"
                p2="Email"
                p3="Cargo"
                p6="Departamento"
                content
                />
            </Background>
        </div>
    )
}

export default Users