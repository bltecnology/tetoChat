import React from "react";

const Background = ({ text, btn1, btn3, children }) => {
    return (
        <div className="bg-gray-200 min-h-screen">
            <div className="flex justify-between items-center p-4">
                <p className="text-4xl text-red-700 ml-10 mt-4 font-semibold">{text}</p>
                <div className="flex gap-10 mr-10 mt-4">
                    <div className="text-2xl text-red-700 rounded-full hover:scale-110 transition-transform transition-colors duration-300">{btn1}</div>
                    <div className="text-2xl text-red-700 rounded-full hover:scale-110 transition-transform transition-colors duration-300" onClick={() => window.location.reload()}>{btn3}</div>
                </div>
            </div>
            <div className="p-4">
                {children}  {/* Certifique-se de que este conteúdo está sendo renderizado. */}
            </div>
        </div>
    );
}

export default Background;
