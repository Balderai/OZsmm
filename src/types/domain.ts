export type AppRole = "accountant" | "client";

export type FolderType = "declarations" | "accruals" | "documents_photos";

export type DocumentOrigin = "accountant_shared" | "client_uploaded";

export type DocumentStatus = "active" | "archived" | "deleted";

export type RequestStatus = "open" | "submitted" | "resolved" | "cancelled";

export type NotificationCategory =
  | "document_shared"
  | "document_request"
  | "reminder"
  | "request_completed"
  | "system";

export type Firm = {
  id: string;
  name: string;
  legalName?: string;
  logoUrl?: string;
  brandColor: string;
};

export type Profile = {
  id: string;
  firmId: string;
  role: AppRole;
  fullName: string;
  email: string;
  isActive: boolean;
};

export type ClientMembership = {
  id: string;
  firmId: string;
  clientId: string;
  userId: string;
  isActive: boolean;
};

export type ClientCompany = {
  id: string;
  firmId: string;
  companyName: string;
  taxNumber?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive: boolean;
};

export type PortalDocument = {
  id: string;
  firmId: string;
  clientId: string;
  folderType: FolderType;
  origin: DocumentOrigin;
  title: string;
  description?: string;
  storageBucket: string;
  storagePath: string;
  mimeType?: string;
  fileSizeBytes?: number;
  status: DocumentStatus;
  createdBy?: string;
  sharedBy?: string;
  sharedAt?: string;
  dueAt?: string;
  createdAt: string;
  viewedByClient?: boolean;
};

export type DocumentRequest = {
  id: string;
  firmId: string;
  clientId: string;
  folderType: FolderType;
  title: string;
  description?: string;
  status: RequestStatus;
  dueAt?: string;
  createdAt: string;
};

export type PortalNotification = {
  id: string;
  firmId: string;
  clientId?: string;
  recipientUserId?: string;
  category: NotificationCategory;
  title: string;
  body: string;
  actionUrl?: string;
  dueAt?: string;
  readAt?: string;
  createdAt: string;
};

export type DashboardMetrics = {
  activeClients: number;
  openRequests: number;
  unreadSharedDocuments: number;
  pendingClientUploads: number;
};
