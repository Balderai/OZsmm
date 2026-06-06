import { appConfig } from "@/lib/config";
import { FOLDER_TYPES, STORAGE_BUCKET } from "@/lib/constants";
import type {
  ClientCompany,
  DashboardMetrics,
  DocumentRequest,
  Firm,
  PortalDocument,
  PortalNotification,
  Profile,
} from "@/types/domain";

const firmId = "11111111-1111-4111-8111-111111111111";
const accountantId = "22222222-2222-4222-8222-222222222222";
const clientUserId = "33333333-3333-4333-8333-333333333333";
const firstClientId = "44444444-4444-4444-8444-444444444444";
const secondClientId = "55555555-5555-4555-8555-555555555555";

export const mockFirm: Firm = {
  id: firmId,
  name: appConfig.firmName,
  legalName: "Demo Mali Musavirlik Ltd.",
  brandColor: "#155E75",
};

export const mockProfiles: Profile[] = [
  {
    id: accountantId,
    firmId,
    role: "accountant",
    fullName: "Ayse Yilmaz",
    email: "ayse@example.com",
    isActive: true,
  },
  {
    id: clientUserId,
    firmId,
    role: "client",
    fullName: "Mehmet Kara",
    email: "mehmet@example.com",
    isActive: true,
  },
];

export const mockClients: ClientCompany[] = [
  {
    id: firstClientId,
    firmId,
    companyName: "Kara Ticaret A.S.",
    taxNumber: "1234567890",
    contactName: "Mehmet Kara",
    contactEmail: "mehmet@example.com",
    contactPhone: "+90 532 000 00 00",
    isActive: true,
  },
  {
    id: secondClientId,
    firmId,
    companyName: "Ege Zeytin Gida",
    taxNumber: "9876543210",
    contactName: "Selin Ege",
    contactEmail: "selin@example.com",
    contactPhone: "+90 533 000 00 00",
    isActive: true,
  },
];

export const mockDocuments: PortalDocument[] = [
  {
    id: "66666666-6666-4666-8666-666666666666",
    firmId,
    clientId: firstClientId,
    folderType: "declarations",
    origin: "accountant_shared",
    title: "Mayis KDV Beyannamesi",
    description: "Beyanname PDF dosyasi",
    storageBucket: STORAGE_BUCKET,
    storagePath: "firm_111/client_444/declarations/2026/06/mayis-kdv.pdf",
    mimeType: "application/pdf",
    fileSizeBytes: 240000,
    status: "active",
    sharedBy: accountantId,
    sharedAt: "2026-06-03T08:00:00.000Z",
    createdAt: "2026-06-03T08:00:00.000Z",
    viewedByClient: false,
  },
  {
    id: "77777777-7777-4777-8777-777777777777",
    firmId,
    clientId: firstClientId,
    folderType: "accruals",
    origin: "accountant_shared",
    title: "Mayis KDV Tahakkuk Fisi",
    storageBucket: STORAGE_BUCKET,
    storagePath: "firm_111/client_444/accruals/2026/06/mayis-tahakkuk.pdf",
    mimeType: "application/pdf",
    fileSizeBytes: 180000,
    status: "active",
    sharedBy: accountantId,
    sharedAt: "2026-06-03T08:10:00.000Z",
    dueAt: "2026-06-26T20:59:00.000Z",
    createdAt: "2026-06-03T08:10:00.000Z",
    viewedByClient: true,
  },
  {
    id: "88888888-8888-4888-8888-888888888888",
    firmId,
    clientId: firstClientId,
    folderType: "documents_photos",
    origin: "client_uploaded",
    title: "Yakit Faturasi Fotograf",
    storageBucket: STORAGE_BUCKET,
    storagePath: "firm_111/client_444/documents_photos/2026/06/yakit.jpg",
    mimeType: "image/jpeg",
    fileSizeBytes: 920000,
    status: "active",
    createdBy: clientUserId,
    createdAt: "2026-06-05T10:20:00.000Z",
  },
  {
    id: "99999999-9999-4999-8999-999999999999",
    firmId,
    clientId: secondClientId,
    folderType: "documents_photos",
    origin: "client_uploaded",
    title: "Banka Dekontu",
    storageBucket: STORAGE_BUCKET,
    storagePath: "firm_111/client_555/documents_photos/2026/06/dekont.pdf",
    mimeType: "application/pdf",
    fileSizeBytes: 120000,
    status: "active",
    createdAt: "2026-06-04T12:00:00.000Z",
  },
];

export const mockRequests: DocumentRequest[] = [
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    firmId,
    clientId: firstClientId,
    folderType: "documents_photos",
    title: "Haziran satis faturalarini yukleyin",
    description: "Ay kapanisindan once faturalarin fotografi veya Excel listesi yeterli.",
    status: "open",
    dueAt: "2026-06-20T20:59:00.000Z",
    createdAt: "2026-06-06T08:00:00.000Z",
  },
  {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    firmId,
    clientId: secondClientId,
    folderType: "documents_photos",
    title: "Personel bordro bilgileri",
    status: "open",
    dueAt: "2026-06-18T20:59:00.000Z",
    createdAt: "2026-06-05T08:00:00.000Z",
  },
];

export const mockNotifications: PortalNotification[] = [
  {
    id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    firmId,
    clientId: firstClientId,
    recipientUserId: clientUserId,
    category: "document_shared",
    title: "Tahakkuk fisiniz hazir",
    body: "Mayis KDV tahakkuk fisiniz Tahakkuklar klasorune eklendi.",
    actionUrl: "/client/folders/accruals",
    createdAt: "2026-06-03T08:15:00.000Z",
  },
  {
    id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    firmId,
    clientId: firstClientId,
    recipientUserId: clientUserId,
    category: "reminder",
    title: "Eksik evrak hatirlatmasi",
    body: "Haziran satis faturalarini yukleyin.",
    actionUrl: "/client",
    dueAt: "2026-06-20T20:59:00.000Z",
    createdAt: "2026-06-06T08:05:00.000Z",
  },
];

export function getDefaultClient() {
  return mockClients[0];
}

export function getFolderCounts(clientId = firstClientId) {
  return Object.fromEntries(
    FOLDER_TYPES.map((folderType) => [
      folderType,
      mockDocuments.filter((document) => document.clientId === clientId && document.folderType === folderType).length,
    ]),
  ) as Record<(typeof FOLDER_TYPES)[number], number>;
}

export function getDashboardMetrics(): DashboardMetrics {
  return {
    activeClients: mockClients.filter((client) => client.isActive).length,
    openRequests: mockRequests.filter((request) => request.status === "open").length,
    unreadSharedDocuments: mockDocuments.filter(
      (document) => document.origin === "accountant_shared" && !document.viewedByClient,
    ).length,
    pendingClientUploads: mockDocuments.filter((document) => document.origin === "client_uploaded").length,
  };
}
