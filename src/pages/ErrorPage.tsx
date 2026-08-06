import { useRouteError } from "react-router";
import { useNavigate } from "react-router";
import { Button } from "@dyordsabuzo/ui-components";

const ErrorPage = () => {
  const error: any = useRouteError();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark">
      <h1 className="text-4xl font-bold text-primary">{error?.status ?? "Error"}</h1>
      <h2 className="text-lg text-text-muted-light dark:text-text-muted-dark">
        {error?.data?.sorry ?? "Something went wrong."}
      </h2>
      <Button label="Go home" onClick={() => navigate("/")} />
    </div>
  );
};

export default ErrorPage;
