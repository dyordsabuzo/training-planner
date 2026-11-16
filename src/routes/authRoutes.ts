export const AUTH_ROUTES = ["/login", "/signup", "/forgot-password", "/password-reset"];

// Pages shown without the app's menus: the auth pages, and the landing page
// at "/" while signed out.
export const isChromelessRoute = (pathname: string, user: unknown) =>
  AUTH_ROUTES.includes(pathname) || (pathname === "/" && !user);
