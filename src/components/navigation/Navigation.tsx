import { Nav, NavItem } from "reactstrap";
import { NavLink, useNavigate } from "react-router";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  faDumbbell,
  faGear,
  faHome,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { useContext } from "react";
import AuthContext from "../../context/AuthContext";
import { NavIcon } from "./NavIcon";
import { ProfileIcon } from "./ProfileIcon";
import { Logo } from "../logo/Logo";

const tabs = [
  {
    // requireUser: false,
    // route: "/training-planner",
    route: "/",
    icon: faHome,
    label: "Home",
  },
  {
    role: "admin",
    // requireUser: true,
    route: "/training-planner/manage",
    icon: faGear,
    label: "Manage",
  },
  {
    role: "user",
    // requireUser: true,
    route: "/training-planner/train",
    icon: faDumbbell,
    label: "Train",
  },
];

const Navigation = () => {
  const authContext = useContext(AuthContext);
  const { user, userPermission } = authContext;
  const navigate = useNavigate();

  return (
    <div>
      <nav
        className={`navbar navbar-expand-md navbar-light sticky-top 
                            border border-bottom-1 d-none d-lg-block`}
        role="navigation"
      >
        <div className="container-fluid relative">
          <div
            className="navbar-brand cursor-pointer fixed flex items-center"
            onClick={() => navigate("/")}
          >
            <Logo className={`w-16`} />
            <span>Training Planner</span>
          </div>
          <Nav className="ml-auto items-center">
            {user && (
              <>
                {userPermission?.role === "admin" && (
                  <NavItem>
                    <NavLink to="/training-planner/manage" className="nav-link">
                      Manage
                    </NavLink>
                  </NavItem>
                )}
                {userPermission?.role &&
                  ["user", "admin"].includes(userPermission.role) && (
                    <NavItem>
                      <NavLink
                        to="/training-planner/train"
                        className="nav-link"
                      >
                        Train
                      </NavLink>
                    </NavItem>
                  )}
              </>
            )}
            {!user && (
              <NavItem>
                <NavLink to="/login" className="nav-link">
                  Login
                </NavLink>
              </NavItem>
            )}
            {user && (
              <NavItem>
                <NavLink to="/logout" className="nav-link">
                  Logout
                </NavLink>
              </NavItem>
            )}
            {user && (
              <NavItem>
                <NavLink to="/logout" className="nav-link">
                  {user && (
                    <ProfileIcon
                      photoUrl={user.photoURL || undefined}
                      label={user.email?.substring(0, 1)?.toUpperCase() || "U"}
                    />
                  )}
                </NavLink>
              </NavItem>
            )}
          </Nav>
        </div>
      </nav>

      <nav
        className={`navbar fixed-bottom navbar-light 
                    border border-top-1 bg-white
                    d-block d-lg-none`}
        role="navigation"
      >
        <Nav className="w-100">
          <div className=" d-flex flex-row justify-content-around w-100">
            {tabs
              .filter(
                (t) =>
                  !t.role ||
                  (t.role && t.role === userPermission?.role) ||
                  userPermission?.role === "admin"
              )
              .map((tab, index) => (
                <NavItem key={`tab-${index}`}>
                  <NavLink
                    to={tab.route}
                    className={({ isActive, isPending }) =>
                      isActive ? "nav-link active" : "nav-link"
                    }
                    style={({ isActive, isPending }) => {
                      return {
                        color: isActive ? "#922c88" : "#55575b",
                      };
                    }}
                  >
                    <NavIcon icon={tab.icon} label={tab.label} />
                  </NavLink>
                </NavItem>
              ))}

            <NavItem>
              <NavLink
                to={user ? "/logout" : "/login"}
                className="nav-link"
                style={
                  !user
                    ? {
                        color: "#55575b",
                      }
                    : {}
                }
              >
                {!user && (
                  <NavIcon icon={faUser} label={user ? "Logout" : "Login"} />
                )}
                {user && (
                  <ProfileIcon
                    photoUrl={user?.photoURL}
                    label={user?.email?.substring(0, 1)?.toUpperCase() || "U"}
                  />
                )}
              </NavLink>
            </NavItem>
          </div>
        </Nav>
      </nav>
    </div>
  );
};

export default Navigation;
