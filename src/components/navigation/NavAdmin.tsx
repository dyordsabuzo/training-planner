import { Link } from "react-router-dom";
import { NavItem } from "reactstrap";

type Props = {
  role: string;
};

export const NavAdmin = ({ role }: Props) => {
  if (role !== "admin") {
    return <></>;
  }

  return (
    <NavItem>
      <Link to="/training-planner/manage" className="nav-link">
        Manage
      </Link>
    </NavItem>
  );
};
