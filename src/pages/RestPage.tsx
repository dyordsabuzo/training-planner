import {CountdownCircleTimer} from "react-countdown-circle-timer";
import {useEffect, useState} from "react";
import WrapperPage from "./WrapperPage";
import Button from "../components/Button";

type RestPageProps = {
    length: number
    toggleRest: (flag: boolean) => void
}

type RenderProps = {
    remainingTime: number
}

const renderTime: React.FC<RenderProps> = ({remainingTime}) => {
    const minutes = Math.floor((remainingTime % 3600) / 60)
    const seconds = remainingTime % 60

    if (remainingTime === 0) {
        return (
            <div className={`flex flex-col items-center`}/>
        )
    }

    return (
        <div className={`flex flex-col items-center`}>
            <div className={`text-md`}>RESTING</div>
            <div className={`text-6xl`}>{('0' + minutes).slice(-2)}:{('0' + seconds).slice(-2)}</div>
        </div>
    );
};

const RestPage: React.FC<RestPageProps> = ({length, toggleRest}) => {
    const [countdownComplete, setCountdownComplete] = useState(false)

    useEffect(() => {
        if (countdownComplete) {
            toggleRest(false)
        }
        return () => {
        }
    }, [countdownComplete, toggleRest])

    return (
        <WrapperPage>
            <div className={`w-full pt-12 grid place-content-center`}>
                {!countdownComplete && (
                    <div className={`w-full`}>`
                        <CountdownCircleTimer
                            isPlaying
                            duration={length}
                            colors={["#004777", "#F7B801", "#A30000", "#A30000"]}
                            colorsTime={[length * (3 / 4), length * (1 / 2), length * (1 / 4), 0]}
                            size={300}
                            onComplete={() => {
                                setCountdownComplete(true)
                                return {shouldRepeat: false, delay: 1}
                            }}
                        >
                            {renderTime}
                        </CountdownCircleTimer>
                    </div>
                )}
                <Button label={"Resume exercise"}
                        className={`my-5 py-3 bg-gray-400 hover:bg-gray-500`}
                        clickHandler={() => toggleRest(false)}/>
                {/*{countdownComplete && (*/}
                {/*    <div className={`w-full absolute top-0 left-0 pt-20 flex flex-col items-center gap-6`}*/}
                {/*         onClick={(e) => toggleRest(false)}>*/}
                {/*        <span>Rest Complete</span>*/}
                {/*        <button type="button"*/}
                {/*                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-full text-sm p-2.5 text-center inline-flex items-center mr-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">*/}
                {/*            <svg aria-hidden="true" className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20"*/}
                {/*                 xmlns="http://www.w3.org/2000/svg">*/}
                {/*                <path fillRule="evenodd"*/}
                {/*                      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"*/}
                {/*                      clipRule="evenodd"></path>*/}
                {/*            </svg>*/}
                {/*            <span className="sr-only">Icon description</span>*/}
                {/*        </button>*/}
                {/*        <span>Resume Superset</span>*/}
                {/*    </div>*/}
                {/*)}*/}
            </div>
        </WrapperPage>
    )
}

export default RestPage;