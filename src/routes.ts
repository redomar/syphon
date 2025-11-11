import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("sign-in", "routes/sign-in.tsx"),
  route("sign-up", "routes/sign-up.tsx"),
  layout("components/layout/ProtectedRoute.tsx", [
    route("dashboard", "routes/dashboard.tsx"),
  ]),
  route("*", "routes/$.tsx"), // Catch-all for unmatched routes
] satisfies RouteConfig;
