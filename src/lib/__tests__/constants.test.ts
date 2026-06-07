import { describe, expect, it } from "vitest";
import { DOCUMENT_MONTH_LABELS, FOLDER_LABELS, FOLDER_TYPES, UPLOAD_DOCUMENT_TYPES } from "@/lib/constants";

describe("folder constants", () => {
  it("keeps exactly three v1 folders", () => {
    expect(FOLDER_TYPES).toEqual(["declarations", "accruals", "documents_photos"]);
  });

  it("maps the Turkish UI labels", () => {
    expect(FOLDER_LABELS.declarations).toBe("Firma Bilgileri");
    expect(FOLDER_LABELS.accruals).toBe("Aylık Tahakkuklar");
    expect(FOLDER_LABELS.documents_photos).toBe("Evrak Yükle");
  });

  it("defines month folders and client upload categories", () => {
    expect(DOCUMENT_MONTH_LABELS["02"]).toBe("02_Şubat");
    expect(UPLOAD_DOCUMENT_TYPES).toEqual([
      "Fiş",
      "Fatura",
      "Serbest Meslek Makbuzu",
      "Gider Pusulası",
      "Yurtdışı Fatura",
      "Diğer",
    ]);
  });
});
