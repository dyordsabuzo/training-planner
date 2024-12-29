import { CountdownCircleTimer } from "react-countdown-circle-timer";

type RenderProps = {
  label?: string;
  remainingTime: number;
};

const RenderTime = ({ label = "RESTING", remainingTime = 60 }: RenderProps) => {
  const minutes = Math.floor((remainingTime % 3600) / 60);
  const seconds = remainingTime % 60;

  if (remainingTime === 0) {
    return <div className={`flex flex-col items-center`} />;
  }

  return (
    <div className={`flex flex-col items-center`}>
      <div className={`text-md`}>{label}</div>
      <div className={`text-6xl`}>
        {("0" + minutes).slice(-2)}:{("0" + seconds).slice(-2)}
      </div>
    </div>
  );
};

type MainProps = {
  length: number;
  label?: string;
  setCountdownComplete: (flag: boolean) => void;
};

export const Timer = ({ length, setCountdownComplete, label }: MainProps) => {
  return (
    <CountdownCircleTimer
      isPlaying
      duration={length}
      colors={["#004777", "#F7B801", "#A30000", "#A30000"]}
      colorsTime={[length * (3 / 4), length * (1 / 2), length * (1 / 4), 0]}
      strokeWidth={16}
      size={300}
      onComplete={() => {
        setCountdownComplete(true);
        return { shouldRepeat: false, delay: 1 };
      }}
    >
      {({ remainingTime }) => (
        <RenderTime remainingTime={remainingTime} label={label} />
      )}
    </CountdownCircleTimer>
  );
};
