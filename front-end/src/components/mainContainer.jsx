import React from "react";

const MainContainer = ({ p1, p2, p3, p4, p5, p6, content }) => {

    const Array = [p1, p2, p3, p4, p5, p6];
    const filterArray = Array.map(p => {
        if (p !== undefined && p !== null) {
            console.log(p);
            return p;
        }
        return null; 
    }).filter(Boolean); 

    return (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
            <table className="w-full text-sm text-left rtl:text-right  ">
                <thead className="text-xs text-white uppercase bg-red-700  ">
                    <tr>
                        {filterArray.map((th, index) => (
                            <th key={index} scope="col" className="px-6 py-3">
                                {th}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {content}
                </tbody>

            </table>
        </div>
    )
}

export default MainContainer;
