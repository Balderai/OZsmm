import type { AppRole } from "@/types/domain";

export function getRouteForRole(role?: AppRole | null) {
  if (role === "accountant") {
    return "/accountant";
  }

  if (role === "client") {
    return "/client";
  }

  return "/login";
}
