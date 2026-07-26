import { NavLink, useLocation, useNavigate } from "react-router";
import {
  faDumbbell,
  faGear,
  faHome,
  faUser,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext, useEffect, useRef, useState } from "react";
import AuthContext from "../../context/AuthContext";
import SidebarContext from "../../context/SidebarContext";
import { NavIcon } from "./NavIcon";
import { ProfileMenu } from "./ProfileMenu";
import { Logo } from "../logo/Logo";
import { ThemeToggle } from "../others/ThemeToggle";
import { AUTH_ROUTES } from "../../routes/authRoutes";
import { isTrainSessionPath } from "../../routes/trainRoutes";

const tabs = [
  {
    route: "/",
    icon: faHome,
    label: "Home",
  },
  {
    role: "admin",
    route: "/training-planner/manage",
    icon: faGear,
    label: "Manage",
  },
  {
    role: "user",
    route: "/training-planner/train",
    icon: faDumbbell,
    label: "Train",
  },
];

const sidebarLinkClassName =
  (isCollapsed: boolean) =>
  ({ isActive }: { isActive: boolean }) =>
    `min-h-11 flex items-center gap-3 rounded-lg text-sm font-medium ${
      isCollapsed ? "justify-center px-0" : "px-3"
    } ${
      isActive
        ? "bg-primary-50 text-primary dark:bg-primary-800/40 dark:text-primary-300"
        : "text-secondary dark:text-secondary-200 hover:bg-gray-50 dark:hover:bg-gray-800"
    }`;

const Navigation = () => {
  const authContext = useContext(AuthContext);
  const { user, userPermission } = authContext;
  const { isCollapsed, toggleSidebar } = useContext(SidebarContext);
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthRoute = AUTH_ROUTES.includes(location.pathname);
  const isSessionRoute = isTrainSessionPath(location.pathname);

  const [isMobileNavRevealed, setIsMobileNavRevealed] = useState(false);
  const dragStartY = useRef<number | null>(null);

  useEffect(() => {
    setIsMobileNavRevealed(false);
  }, [location.pathname]);

  const DRAG_THRESHOLD = 15;

  const handleHandleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
  };

  const handleHandleTouchEnd = (e: React.TouchEvent) => {
    if (dragStartY.current === null) {
      return;
    }
    const deltaY = e.changedTouches[0].clientY - dragStartY.current;
    dragStartY.current = null;

    if (deltaY < -DRAG_THRESHOLD) {
      setIsMobileNavRevealed(true);
    } else if (deltaY > DRAG_THRESHOLD) {
      setIsMobileNavRevealed(false);
    }
  };

  const visibleTabs = tabs.filter(
    (t) =>
      !t.role ||
      (t.role && t.role === userPermission?.role) ||
      userPermission?.role === "admin"
  );

  return (
    <div>
      {!isAuthRoute && (
        <ThemeToggle className="fixed top-4 right-4 z-30 bg-white/80 dark:bg-surface-dark/80 backdrop-blur shadow-sm" />
      )}

      <nav
        className={`${isAuthRoute ? "hidden" : "hidden lg:flex"} lg:fixed lg:inset-y-0 lg:left-0 lg:z-20
                   ${isCollapsed ? "lg:w-20" : "lg:w-64"}
                   lg:flex-col relative
                   transition-[width] duration-200 ease-in-out
                   border-r border-gray-200 dark:border-gray-700
                   bg-white dark:bg-surface-dark`}
        role="navigation"
      >
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden lg:flex absolute top-6 -right-3 z-30 w-6 h-6 items-center justify-center rounded-full
            bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700
            text-secondary dark:text-secondary-200 shadow-sm
            hover:text-primary dark:hover:text-primary-300
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <FontAwesomeIcon icon={isCollapsed ? faChevronRight : faChevronLeft} className="text-[10px]" />
        </button>

        <button
          type="button"
          onClick={() => navigate("/")}
          title={isCollapsed ? "Training Planner" : undefined}
          className={`flex items-center gap-2 min-h-11 mt-4 mb-2 focus-visible:outline-none
                     focus-visible:ring-2 focus-visible:ring-primary rounded-md
                     ${isCollapsed ? "justify-center mx-2" : "mx-4"}`}
        >
          <Logo className="w-9 h-9 shrink-0 text-primary dark:text-primary-300" />
          {!isCollapsed && (
            <span className="font-semibold text-text-light dark:text-text-dark whitespace-nowrap">
              Training Planner
            </span>
          )}
        </button>

        <div className={`flex-1 flex flex-col gap-1 py-2 overflow-y-auto overflow-x-hidden ${isCollapsed ? "px-2" : "px-3"}`}>
          {visibleTabs.map((tab) => (
            <NavLink
              key={tab.route}
              to={tab.route}
              title={isCollapsed ? tab.label : undefined}
              className={sidebarLinkClassName(isCollapsed)}
            >
              <FontAwesomeIcon icon={tab.icon} fixedWidth />
              <span className={isCollapsed ? "sr-only" : "whitespace-nowrap"}>{tab.label}</span>
            </NavLink>
          ))}
          {!user && (
            <NavLink
              to="/login"
              title={isCollapsed ? "Login" : undefined}
              className={sidebarLinkClassName(isCollapsed)}
            >
              <FontAwesomeIcon icon={faUser} fixedWidth />
              <span className={isCollapsed ? "sr-only" : "whitespace-nowrap"}>Login</span>
            </NavLink>
          )}
        </div>

        {user && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-3 flex items-center gap-2">
            <ProfileMenu
              email={user.email}
              photoUrl={user.photoURL}
              showEmail={!isCollapsed}
              menuAlign="left"
            />
          </div>
        )}
      </nav>

      <div className="lg:hidden fixed bottom-0 inset-x-0 z-20">
        {isSessionRoute && !isAuthRoute && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setIsMobileNavRevealed((revealed) => !revealed)}
              onTouchStart={handleHandleTouchStart}
              onTouchEnd={handleHandleTouchEnd}
              aria-label={isMobileNavRevealed ? "Hide menu" : "Show menu"}
              aria-expanded={isMobileNavRevealed}
              className="w-16 h-8 flex items-center justify-center rounded-t-full
                border border-b-0 border-gray-200 dark:border-gray-700
                bg-white dark:bg-surface-dark text-secondary dark:text-secondary-200
                shadow-sm transition-transform duration-150 active:scale-95
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <FontAwesomeIcon
                icon={isMobileNavRevealed ? faChevronDown : faChevronUp}
                className="text-xs transition-transform duration-300"
              />
            </button>
          </div>
        )}

        <div
          className={`overflow-hidden transition-[max-height] duration-300 ease-in-out
            ${isAuthRoute || (isSessionRoute && !isMobileNavRevealed) ? "max-h-0" : "max-h-24"}`}
        >
          <nav
            className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark"
            role="navigation"
          >
            <div className="flex flex-row items-center justify-around">
              {visibleTabs.map((tab, index) => (
                <NavLink
                  key={`tab-${index}`}
                  to={tab.route}
                  className={({ isActive }) =>
                    `min-h-11 flex-1 flex items-center justify-center py-2 ${
                      isActive
                        ? "text-primary dark:text-primary-300"
                        : "text-secondary dark:text-secondary-200"
                    }`
                  }
                >
                  <NavIcon icon={tab.icon} label={tab.label} />
                </NavLink>
              ))}

              {user ? (
                <div className="min-h-11 flex-1 flex items-center justify-center py-2">
                  <ProfileMenu
                    email={user.email}
                    photoUrl={user.photoURL}
                    showEmail={false}
                    menuAlign="right"
                  />
                </div>
              ) : (
                <NavLink
                  to="/login"
                  className="min-h-11 flex-1 flex items-center justify-center py-2 text-secondary dark:text-secondary-200"
                >
                  <NavIcon icon={faUser} label="Login" />
                </NavLink>
              )}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
