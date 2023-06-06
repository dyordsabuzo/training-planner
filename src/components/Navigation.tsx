import {Nav, NavItem} from "reactstrap";
import {NavLink} from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import {faDumbbell, faGear, faHome} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

const tabs = [
    {route: "/training-planner", icon: faHome, label: "Home"},
    {route: "/training-planner/manage", icon: faGear, label: "Manage"},
    {route: "/training-planner/train", icon: faDumbbell, label: "Train"},
]

const Navigation = () => {
    return (
        <div>

            <nav className={`navbar navbar-expand-md navbar-light sticky-top 
                            border border-bottom-1 d-none d-lg-block`}
                 role="navigation">
                <div className="container-fluid">
                    <a className="navbar-brand" href="/home">Training Planner</a>
                    <Nav className="ml-auto">
                        <NavItem>
                            <NavLink to="/training-planner/manage" className="nav-link">
                                Manage
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink to="/training-planner/train" className="nav-link">
                                Train
                            </NavLink>
                        </NavItem>
                    </Nav>
                </div>
            </nav>

            <nav className={`navbar fixed-bottom navbar-light 
                    border border-top-1 bg-white
                    d-block d-lg-none`}
                 role="navigation">
                <Nav className="w-100">
                    <div className=" d-flex flex-row justify-content-around w-100">
                        {
                            tabs.map((tab, index) => (
                                <NavItem key={`tab-${index}`}>
                                    <NavLink to={tab.route}
                                             className={({isActive, isPending}) =>
                                                 isActive ? "nav-link active" : "nav-link"
                                             }
                                             style={({isActive, isPending}) => {
                                                 return {
                                                     color: isActive ? "#922c88" : "#55575b"
                                                 };
                                             }}
                                    >
                                        <div className={`d-flex flex-column justify-content-center 
                                                align-items-center`}>
                                            <FontAwesomeIcon size="lg" icon={tab.icon}/>
                                            <div className={`text-xs`}>{tab.label}</div>
                                        </div>
                                    </NavLink>
                                </NavItem>
                            ))
                        }
                    </div>
                </Nav>
            </nav>
        </div>
    )
}

export default Navigation