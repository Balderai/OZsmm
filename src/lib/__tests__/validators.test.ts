import { describe, expect, it } from "vitest";
import { notificationPayloadSchema } from "@/lib/validators";

describe("notification payload validation", () => {
  it("accepts a valid accountant reminder", () => {
    expect(
      notificationPayloadSchema.safeParse({
        client_id: "44444444-4444-4444-8444-444444444444",
        title: "KDV tahakkukunuz hazir",
        body: "Haziran ayi tahakkuk fisi portala yuklendi.",
        category: "reminder",
        action_url: "/client/folders/accruals",
      }).success,
    ).toBe(true);
  });

  it("rejects external action urls", () => {
    expect(
      notificationPayloadSchema.safeParse({
        client_id: "44444444-4444-4444-8444-444444444444",
        title: "KDV",
        body: "Hazir",
        category: "reminder",
        action_url: "https://example.com",
      }).success,
    ).toBe(false);
  });
});
