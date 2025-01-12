import WrapperPage from "./WrapperPage";
import { useContext } from "react";
import AuthContext from "../context/AuthContext";

export const Home = () => {
  const authContext = useContext(AuthContext);
  const { user } = authContext;

  return (
    <WrapperPage>
      <div className="flex flex-col pt-6 w-full">
        <h1 className="text-2xl font-bold">You are home</h1>
        <p>
          This is the home page. You can use this page to navigate to the
          different pages of the application.
        </p>
      </div>
    </WrapperPage>
  );
};
