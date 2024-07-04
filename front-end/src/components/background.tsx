import React, { ReactNode } from "react";

interface BackgroundProps {
    btn1: ReactNode;
    btn2: ReactNode;
    btn3: ReactNode;
    text: string;
    children: ReactNode;  
}

const Background: React.FC<BackgroundProps> = ({ text, btn1, btn2, btn3, children }) => {
    return (
        <div className="bg-pink-100 min-h-screen">
            <div className="flex justify-between items-center p-4">
                <p className="text-3xl ml-10 mt-4 font-semibold">{text}</p>
                <div className="flex gap-10 mr-10 mt-4">
                    <div className="text-2xl">{btn1}</div>
                    <div className="text-2xl">{btn2}</div>
                    <div className="text-2xl">{btn3}</div>
                </div>
            </div>
            <div className="p-4">
                {children}  {/* Certifique-se de que este conteúdo está sendo renderizado. */}
            </div>
        </div>
    );
}

export default Background;
