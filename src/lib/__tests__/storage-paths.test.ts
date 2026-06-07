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

  it("uses selected subfolders when provided", () => {
    expect(
      buildDocumentStoragePath({
        firmId: "111",
        clientId: "222",
        folderType: "documents_photos",
        documentId: "333",
        fileName: "Yakıt Faturası.jpg",
        subFolders: ["06_Haziran", "Fatura"],
      }),
    ).toBe("firm_111/client_222/documents_photos/06_haziran/fatura/333__yak-t-faturas-.jpg");
  });
});
