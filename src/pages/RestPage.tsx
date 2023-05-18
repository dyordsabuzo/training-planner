import {CountdownCircleTimer} from "react-countdown-circle-timer";
import {useState} from "react";

type RestPageProps = {
    length: number
    toggleRest: (flag: boolean) => void
}

type RenderProps = {
    remainingTime: number
}

const renderTime: React.FC<RenderProps> = ({remainingTime}) => {
    if (remainingTime === 0) {
        return (
            <div className={`flex flex-col items-center`}>
                {/*<span>Rest Complete</span>*/}
                {/*<button type="button"*/}
                {/*        className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-full text-sm p-2.5 text-center inline-flex items-center mr-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">*/}
                {/*    <svg aria-hidden="true" className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20"*/}
                {/*         xmlns="http://www.w3.org/2000/svg">*/}
                {/*        <path fillRule="evenodd"*/}
                {/*              d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"*/}
                {/*              clipRule="evenodd"></path>*/}
                {/*    </svg>*/}
                {/*    <span className="sr-only">Icon description</span>*/}
                {/*</button>*/}
                {/*<span>Resume Superset</span>*/}
            </div>
        )
    }

    return (
        <div className={`flex flex-col items-center`}>
            <div className={`text-md`}>RESTING</div>
            <div className={`text-6xl`}>{remainingTime}</div>
            <div className={`text-xs`}>seconds</div>
        </div>
    );
};

const RestPage: React.FC<RestPageProps> = ({length, toggleRest}) => {
    const [countdownComplete, setCountdownComplete] = useState(false)

    return (
        <div className={`relative w-full`}>
            {!countdownComplete && (
                <div className={`w-full absolute top-0 left-0 pt-20 flex flex-col items-center gap-6`}>
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
            {countdownComplete && (
                <div className={`w-full absolute top-0 left-0 pt-20 flex flex-col items-center gap-6`}
                     onClick={(e) => toggleRest(false)}>
                    <span>Rest Complete</span>
                    <button type="button"
                            className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-full text-sm p-2.5 text-center inline-flex items-center mr-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                        <svg aria-hidden="true" className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20"
                             xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd"
                                  d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                                  clipRule="evenodd"></path>
                        </svg>
                        <span className="sr-only">Icon description</span>
                    </button>
                    <span>Resume Superset</span>
                </div>
            )}
        </div>
    )
}

export default RestPage;