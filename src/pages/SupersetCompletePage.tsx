import Button from "../components/Button";
import React from "react";
import WrapperPage from "./WrapperPage";

type SupersetCompletePageProps = {
    superset: string,
    nextPageHandler: (flag: boolean) => void
}

const SupersetCompletePage: React.FC<SupersetCompletePageProps> = ({superset, nextPageHandler}) => {
    return (
        <WrapperPage>
            <div className={`flex flex-col gap-2 pt-8`}>
                <div className={`grid place-content-center gap-4 shadow-md p-4 py-6 mb-4 border rounded-md`}>
                <span className={`grid place-content-center text-2xl text-gray-500`}>
                        {superset}
                </span>
                    <span className={`grid place-content-center text-lg text-gray-500`}>
                        SUPERSET COMPLETE
                </span>
                </div>
                <Button className={`py-4`} label={"NEXT"} clickHandler={nextPageHandler}/>
            </div>
        </WrapperPage>
    )
}

export default SupersetCompletePage;