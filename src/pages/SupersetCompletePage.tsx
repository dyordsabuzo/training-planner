import Button from "../components/Button";
import React from "react";
import WrapperPage from "./WrapperPage";

type SupersetCompletePageProps = {
    superset: string
    nextSuperset: any
    nextPageHandler: (flag: boolean) => void
}

const SupersetCompletePage: React.FC<SupersetCompletePageProps> = ({superset, nextSuperset, nextPageHandler}) => {
    return (
        <WrapperPage>
            <div className={`grid place-content-center gap-3 pt-8`}>
                <Button className={`py-4`} label={"NEXT"} clickHandler={nextPageHandler}/>
                <div
                    className={`grid place-content-center gap-2 shadow-md p-4 py-6 border rounded-md bg-green-400`}>
                    <span className={`grid place-content-center text-lg text-white`}> SUPERSET COMPLETE </span>
                    <span className={`grid place-content-center text-2xl text-white font-semibold`}>
                        {superset}
                    </span>
                </div>
                {nextSuperset && (
                    <div className={`grid place-content-center gap-4 shadow-md p-4 py-6 border rounded-md`}>
                        <span className={`grid place-content-center text-lg text-gray-500`}> NEXT SUPERSET </span>
                        <span className={`grid place-content-center text-2xl text-gray-500 leading-none`}>
                        {nextSuperset.name}
                    </span>
                        <div className={`leading-none`}>
                            {nextSuperset.exercises.map((exercise: any) => (
                                <div key={exercise.id}
                                     className={`grid place-content-center text-sm`}
                                >{exercise.name}</div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </WrapperPage>
    )
}

export default SupersetCompletePage;