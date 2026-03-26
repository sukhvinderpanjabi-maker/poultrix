/**
 * Minimal react-router-dom v6 compatibility shim.
 * Implements BrowserRouter, Routes, Route, Navigate, NavLink, Outlet,
 * useNavigate, useLocation, useParams using browser History API + React context.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import React from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Params = Record<string, string>;

interface Location {
  pathname: string;
  search: string;
  hash: string;
}

interface RouterState {
  location: Location;
  navigate: (to: string, options?: { replace?: boolean }) => void;
}

interface RouteCtxState {
  params: Params;
  outlet: ReactNode;
}

export interface RouteProps {
  path?: string;
  index?: boolean;
  element?: ReactNode;
  children?: ReactNode;
  roles?: string[];
}

export interface NavLinkProps {
  to: string;
  children?: ReactNode;
  className?: string | ((props: { isActive: boolean }) => string);
  onClick?: () => void;
  end?: boolean;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Contexts
// ---------------------------------------------------------------------------

const RouterCtx = createContext<RouterState>({
  location: { pathname: "/", search: "", hash: "" },
  navigate: () => {},
});

const RouteCtx = createContext<RouteCtxState>({
  params: {},
  outlet: null,
});

// ---------------------------------------------------------------------------
// Matching helpers
// ---------------------------------------------------------------------------

function norm(s: string): string {
  return s.replace(/^\/+/, "").replace(/\/+$/, "");
}

/** Exact match. Returns params or null. Works for both absolute and relative patterns. */
function matchExact(pattern: string, pathname: string): Params | null {
  const pat = norm(pattern);
  const path = norm(pathname);

  if (pat === "" && path === "") return {};
  if (pat === "" || path === "") return null;

  const patParts = pat.split("/");
  const pathParts = path.split("/");

  if (patParts.length !== pathParts.length) return null;

  const params: Params = {};
  for (let i = 0; i < patParts.length; i++) {
    if (patParts[i].startsWith(":")) {
      params[patParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
    } else if (patParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return params;
}

/** Prefix match for parent routes. Returns { params, remaining } or null. */
function matchPrefix(
  pattern: string,
  pathname: string,
): { params: Params; remaining: string } | null {
  if (pattern === "/") {
    return { params: {}, remaining: pathname };
  }

  const patParts = pattern.replace(/^\//, "").split("/");
  const pathParts = pathname.replace(/^\//, "").split("/").filter(Boolean);

  if (patParts.length > pathParts.length) return null;

  const params: Params = {};
  for (let i = 0; i < patParts.length; i++) {
    if (patParts[i].startsWith(":")) {
      params[patParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
    } else if (patParts[i] !== pathParts[i]) {
      return null;
    }
  }

  const remaining = `/${pathParts.slice(patParts.length).join("/")}`;
  return { params, remaining };
}

// ---------------------------------------------------------------------------
// BrowserRouter
// ---------------------------------------------------------------------------

export function BrowserRouter({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<Location>({
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
  });

  useEffect(() => {
    const handlePop = () => {
      setLocation({
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
      });
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

  const navigate = useCallback(
    (to: string, options: { replace?: boolean } = {}) => {
      if (options.replace) {
        window.history.replaceState(null, "", to);
      } else {
        window.history.pushState(null, "", to);
      }
      setLocation({
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
      });
    },
    [],
  );

  return (
    <RouterCtx.Provider value={{ location, navigate }}>
      {children}
    </RouterCtx.Provider>
  );
}

// ---------------------------------------------------------------------------
// Route (declarative — never renders directly; read by Routes)
// ---------------------------------------------------------------------------

export function Route(_props: RouteProps): null {
  return null;
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export function Routes({ children }: { children: ReactNode }) {
  const { location } = useContext(RouterCtx);
  const pathname = location.pathname;

  const routes = React.Children.toArray(children)
    .filter(React.isValidElement)
    .filter((el) => (el as React.ReactElement).type === Route);

  for (const routeEl of routes) {
    const props = (routeEl as React.ReactElement<RouteProps>).props;
    const { path, index: isIndex, element, children: routeChildren } = props;

    if (isIndex) continue; // Top-level index routes are handled by parent
    if (!path) continue;

    const childRoutes = routeChildren
      ? React.Children.toArray(routeChildren)
          .filter(React.isValidElement)
          .filter((el) => (el as React.ReactElement).type === Route)
      : [];

    if (childRoutes.length > 0) {
      // Parent route — prefix match
      const prefixMatch = matchPrefix(path, pathname);
      if (!prefixMatch) continue;

      const { params: parentParams, remaining } = prefixMatch;
      let outlet: ReactNode = null;

      for (const childEl of childRoutes) {
        const cp = (childEl as React.ReactElement<RouteProps>).props;

        if (cp.index) {
          if (remaining === "/" || remaining === "") {
            outlet = (
              <RouteCtx.Provider value={{ params: parentParams, outlet: null }}>
                {cp.element}
              </RouteCtx.Provider>
            );
            break;
          }
        } else if (cp.path) {
          const childParams = matchExact(cp.path, remaining);
          if (childParams !== null) {
            const allParams = { ...parentParams, ...childParams };
            outlet = (
              <RouteCtx.Provider value={{ params: allParams, outlet: null }}>
                {cp.element}
              </RouteCtx.Provider>
            );
            break;
          }
        }
      }

      return (
        <RouteCtx.Provider value={{ params: parentParams, outlet }}>
          {element}
        </RouteCtx.Provider>
      );
    }

    // Leaf route — exact match
    const params = matchExact(path, pathname);
    if (params !== null) {
      return (
        <RouteCtx.Provider value={{ params, outlet: null }}>
          {element}
        </RouteCtx.Provider>
      );
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Navigate
// ---------------------------------------------------------------------------

export function Navigate({
  to,
  replace = false,
}: { to: string; replace?: boolean }) {
  const { navigate } = useContext(RouterCtx);
  const done = useRef(false);
  useLayoutEffect(() => {
    if (!done.current) {
      done.current = true;
      navigate(to, { replace });
    }
  });
  return null;
}

// ---------------------------------------------------------------------------
// Outlet
// ---------------------------------------------------------------------------

export function Outlet() {
  const { outlet } = useContext(RouteCtx);
  return <>{outlet}</>;
}

// ---------------------------------------------------------------------------
// NavLink
// ---------------------------------------------------------------------------

export function NavLink({
  to,
  children,
  className,
  onClick,
  end,
  ...rest
}: NavLinkProps) {
  const { location, navigate } = useContext(RouterCtx);
  const isActive = end
    ? location.pathname === to
    : location.pathname === to ||
      location.pathname.startsWith(to.endsWith("/") ? to : `${to}/`);

  const resolvedClass =
    typeof className === "function" ? className({ isActive }) : className;

  return (
    <a
      href={to}
      className={resolvedClass}
      onClick={(e) => {
        e.preventDefault();
        onClick?.();
        navigate(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useNavigate() {
  return useContext(RouterCtx).navigate;
}

export function useLocation(): Location {
  return useContext(RouterCtx).location;
}

export function useParams<
  T extends Record<string, string | undefined>,
>(): Partial<T> {
  return useContext(RouteCtx).params as Partial<T>;
}
