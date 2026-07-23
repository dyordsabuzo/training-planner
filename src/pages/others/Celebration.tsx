import Confetti from "react-confetti";

export const Celebration = () => {
  const { innerWidth: width, innerHeight: height } = window;

  return (
    <>
      <div className={`flex justify-center`}>
        <Confetti width={width} height={height} />
      </div>
    </>
  );
};
