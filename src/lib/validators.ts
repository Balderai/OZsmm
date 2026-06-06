import { z } from "zod";
import { ALLOWED_MIME_TYPES, FOLDER_TYPES, MAX_UPLOAD_BYTES } from "@/lib/constants";

export const notificationPayloadSchema = z.object({
  client_id: z.string().uuid(),
  title: z.string().min(3).max(120),
  body: z.string().min(3).max(500),
  category: z.enum(["document_shared", "document_request", "reminder", "request_completed", "system"]),
  action_url: z.string().startsWith("/").optional(),
  due_at: z.string().datetime().optional(),
});

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(10),
    auth: z.string().min(10),
  }),
});

export const signedUrlPayloadSchema = z.object({
  document_id: z.string().uuid(),
});

export const uploadMetadataSchema = z.object({
  client_id: z.string().uuid(),
  folder_type: z.enum(FOLDER_TYPES),
  title: z.string().min(2).max(140),
  file_name: z.string().min(1).max(220),
  mime_type: z.enum(ALLOWED_MIME_TYPES),
  file_size_bytes: z.number().int().positive().max(MAX_UPLOAD_BYTES),
  origin: z.enum(["accountant_shared", "client_uploaded"]).default("client_uploaded"),
});

export const createClientPayloadSchema = z.object({
  company_name: z.string().min(2).max(180),
  tax_number: z.string().max(32).optional(),
  contact_name: z.string().max(140).optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().max(40).optional(),
  temporary_password: z.string().min(8).max(256).optional(),
});

export const createRequestPayloadSchema = z.object({
  client_id: z.string().uuid(),
  title: z.string().min(3).max(180),
  description: z.string().max(1000).optional(),
  folder_type: z.enum(FOLDER_TYPES).default("documents_photos"),
  due_at: z.string().datetime().optional(),
});

export const loginPayloadSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(256),
});
