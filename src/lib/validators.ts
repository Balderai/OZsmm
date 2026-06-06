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
});
