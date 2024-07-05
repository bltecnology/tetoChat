import React from "react";
import Header from '../components/header';
import Background from '../components/background';
import MainContainer from "../components/mainContainer";

const Account: React.FC = () => {
    return(
        <div>
            <Header />
            <Background
                text="Conta"
            >
                <MainContainer
                    content = {
                        <div>
                                
                        </div>
                    }
                ></MainContainer>
            </Background>
        </div>
    )
}

export default Account;