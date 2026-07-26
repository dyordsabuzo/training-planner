import { Logo } from "../../components/logo/Logo";

export const Loading = () => {
  return (
    <div
      className={`h-[80vh] flex flex-col place-content-center items-center opacity-60`}
    >
      <Logo
        className="w-60 h-60 text-primary dark:text-primary-300 animate-pulse transition duration-200 ease-in-out"
      />
    </div>
  );
};
