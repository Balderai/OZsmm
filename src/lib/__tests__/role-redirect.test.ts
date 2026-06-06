import { describe, expect, it } from "vitest";
import { getRouteForRole } from "@/lib/role-redirect";

describe("getRouteForRole", () => {
  it("routes known roles to isolated dashboards", () => {
    expect(getRouteForRole("accountant")).toBe("/accountant");
    expect(getRouteForRole("client")).toBe("/client");
  });

  it("falls back to login when no profile role exists", () => {
    expect(getRouteForRole(null)).toBe("/login");
  });
});
