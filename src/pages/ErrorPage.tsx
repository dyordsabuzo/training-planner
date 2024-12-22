import { useRouteError } from "react-router";

const ErrorPage = () => {
  const error: any = useRouteError();

  return (
    <div>
      <h1>{error.status}</h1>
      <h2>{error.data.sorry}</h2>
      <p>ERROR</p>
    </div>
  );
};

export default ErrorPage;
