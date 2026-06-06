import { describe, expect, it } from "vitest";
import { buildDocumentStoragePath } from "@/lib/storage-paths";

describe("buildDocumentStoragePath", () => {
  it("creates a scoped private storage path", () => {
    expect(
      buildDocumentStoragePath({
        firmId: "111",
        clientId: "222",
        folderType: "accruals",
        documentId: "333",
        fileName: "KDV Tahakkuk Fisi.pdf",
        now: new Date("2026-06-06T12:00:00.000Z"),
      }),
    ).toBe("firm_111/client_222/accruals/2026/06/333__kdv-tahakkuk-fisi.pdf");
  });
});
