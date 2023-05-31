import React from "react";
import WrapperPage from "./WrapperPage";
import {useNavigate} from "react-router-dom";

type Props = {
    listing?: string
}

const MainPage: React.FC<Props> = ({listing}) => {
    const navigate = useNavigate()


    return (
        <WrapperPage>
            <button type={"button"}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-6 px-2 rounded"
                    onClick={() => {
                        navigate("/training-planner/train")
                    }}>
                START TRAINING
            </button>

            <button type={"button"}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-6 px-4 rounded"
                    onClick={() => {
                        navigate("/training-planner/manage")
                    }}>
                Manage Training Setup
            </button>
        </WrapperPage>
    )
}

export default MainPage