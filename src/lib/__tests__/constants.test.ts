import { describe, expect, it } from "vitest";
import { FOLDER_LABELS, FOLDER_TYPES } from "@/lib/constants";

describe("folder constants", () => {
  it("keeps exactly three v1 folders", () => {
    expect(FOLDER_TYPES).toEqual(["declarations", "accruals", "documents_photos"]);
  });

  it("maps the Turkish UI labels", () => {
    expect(FOLDER_LABELS.documents_photos).toBe("Evrak ve Fotograflar");
  });
});
