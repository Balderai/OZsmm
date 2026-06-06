import fs from "node:fs";
import path from "node:path";
import {
  AppwriteException,
  Client,
  Permission,
  Role,
  Storage,
  TablesDB,
  TablesDBIndexType,
} from "node-appwrite";

loadEnv(path.join(process.cwd(), ".env.local"));
loadEnv(path.join(process.cwd(), ".env"));

const endpoint = requireEnv("NEXT_PUBLIC_APPWRITE_ENDPOINT");
const projectId = requireEnv("NEXT_PUBLIC_APPWRITE_PROJECT_ID");
const apiKey = requireEnv("APPWRITE_API_KEY");
const databaseId = process.env.APPWRITE_DATABASE_ID || "ozsmm";
const bucketId = process.env.APPWRITE_BUCKET_ID || "client-documents";

const tableIds = {
  firms: process.env.APPWRITE_FIRMS_TABLE_ID || "firms",
  profiles: process.env.APPWRITE_PROFILES_TABLE_ID || "profiles",
  clients: process.env.APPWRITE_CLIENTS_TABLE_ID || "clients",
  documents: process.env.APPWRITE_DOCUMENTS_TABLE_ID || "documents",
  requests: process.env.APPWRITE_REQUESTS_TABLE_ID || "document_requests",
  notifications: process.env.APPWRITE_NOTIFICATIONS_TABLE_ID || "notifications",
  pushSubscriptions: process.env.APPWRITE_PUSH_SUBSCRIPTIONS_TABLE_ID || "push_subscriptions",
};

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const tables = new TablesDB(client);
const storage = new Storage(client);

const tablePermissions = [
  Permission.read(Role.users()),
  Permission.create(Role.users()),
  Permission.update(Role.users()),
  Permission.delete(Role.users()),
];

const seedFirmId = "11111111-1111-4111-8111-111111111111";
const seedClientId = "44444444-4444-4444-8444-444444444444";
const secondClientId = "55555555-5555-4555-8555-555555555555";

async function main() {
  console.log(`Appwrite project: ${projectId}`);
  await ensureDatabase(databaseId, "OZ SMM Portal");
  await ensureBucket(bucketId, "client-documents");
  await ensureTables();
  await ensureSeedRows();
  console.log("Appwrite setup complete.");
}

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([^=]+)=(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function isConflict(error) {
  return error instanceof AppwriteException && (error.code === 409 || error.type?.includes("already_exists"));
}

function isMissing(error) {
  return error instanceof AppwriteException && error.code === 404;
}

async function ignoreConflict(action, label) {
  try {
    const result = await action();
    console.log(`created ${label}`);
    return result;
  } catch (error) {
    if (isConflict(error)) {
      console.log(`exists ${label}`);
      return null;
    }
    throw error;
  }
}

async function ensureDatabase(id, name) {
  try {
    await tables.get({ databaseId: id });
    console.log(`exists database ${id}`);
  } catch (error) {
    if (!isMissing(error)) throw error;
    await tables.create({ databaseId: id, name, enabled: true });
    console.log(`created database ${id}`);
  }
}

async function ensureTable(tableId, name) {
  try {
    await tables.getTable({ databaseId, tableId });
    console.log(`exists table ${tableId}`);
  } catch (error) {
    if (!isMissing(error)) throw error;
    await tables.createTable({
      databaseId,
      tableId,
      name,
      permissions: tablePermissions,
      rowSecurity: true,
      enabled: true,
    });
    console.log(`created table ${tableId}`);
  }
}

async function ensureBucket(id, name) {
  try {
    await storage.getBucket({ bucketId: id });
    console.log(`exists bucket ${id}`);
  } catch (error) {
    if (!isMissing(error)) throw error;
    await storage.createBucket({
      bucketId: id,
      name,
      permissions: [],
      fileSecurity: true,
      enabled: true,
      maximumFileSize: 25 * 1024 * 1024,
      allowedFileExtensions: ["pdf", "jpg", "jpeg", "png", "webp", "xlsx", "xls", "csv"],
      compression: "none",
      encryption: true,
      antivirus: true,
    });
    console.log(`created bucket ${id}`);
  }
}

async function ensureTables() {
  await ensureTable(tableIds.firms, "Firms");
  await ensureColumns(tableIds.firms, [
    varchar("name", 160, true),
    varchar("legal_name", 180, false),
    varchar("logo_url", 500, false),
    varchar("brand_color", 20, true, "#155E75"),
  ]);

  await ensureTable(tableIds.profiles, "Profiles");
  await ensureColumns(tableIds.profiles, [
    varchar("firm_id", 64, true),
    appEnum("role", ["accountant", "client"], true),
    varchar("full_name", 160, true),
    email("email", true),
    bool("is_active", true, true),
  ]);
  await ensureIndex(tableIds.profiles, "profiles_firm_role_idx", ["firm_id", "role"]);

  await ensureTable(tableIds.clients, "Clients");
  await ensureColumns(tableIds.clients, [
    varchar("firm_id", 64, true),
    varchar("company_name", 180, true),
    varchar("tax_number", 32, false),
    varchar("contact_name", 140, false),
    email("contact_email", false),
    varchar("contact_phone", 40, false),
    bool("is_active", true, true),
  ]);
  await ensureIndex(tableIds.clients, "clients_firm_company_idx", ["firm_id", "company_name"]);

  await ensureTable(tableIds.documents, "Documents");
  await ensureColumns(tableIds.documents, [
    varchar("firm_id", 64, true),
    varchar("client_id", 64, true),
    appEnum("folder_type", ["declarations", "accruals", "documents_photos"], true),
    appEnum("origin", ["accountant_shared", "client_uploaded"], true),
    varchar("title", 180, true),
    text("description", false),
    varchar("storage_bucket", 90, true, bucketId),
    varchar("storage_path", 700, true),
    varchar("mime_type", 140, false),
    integer("file_size_bytes", false, 0, 25 * 1024 * 1024),
    appEnum("status", ["active", "archived", "deleted"], true, "active"),
    varchar("created_by", 64, false),
    varchar("shared_by", 64, false),
    datetime("shared_at", false),
    datetime("due_at", false),
  ]);
  await ensureIndex(tableIds.documents, "documents_client_folder_idx", ["client_id", "folder_type", "status"]);

  await ensureTable(tableIds.requests, "Document Requests");
  await ensureColumns(tableIds.requests, [
    varchar("firm_id", 64, true),
    varchar("client_id", 64, true),
    appEnum("folder_type", ["declarations", "accruals", "documents_photos"], true, "documents_photos"),
    varchar("title", 180, true),
    text("description", false),
    appEnum("status", ["open", "submitted", "resolved", "cancelled"], true, "open"),
    datetime("due_at", false),
    varchar("created_by", 64, false),
    varchar("resolved_by", 64, false),
    datetime("resolved_at", false),
  ]);
  await ensureIndex(tableIds.requests, "requests_client_status_idx", ["client_id", "status"]);

  await ensureTable(tableIds.notifications, "Notifications");
  await ensureColumns(tableIds.notifications, [
    varchar("firm_id", 64, true),
    varchar("client_id", 64, false),
    varchar("recipient_user_id", 64, false),
    appEnum("category", ["document_shared", "document_request", "reminder", "request_completed", "system"], true),
    varchar("title", 180, true),
    text("body", true),
    varchar("action_url", 500, false),
    varchar("related_document_id", 64, false),
    varchar("related_request_id", 64, false),
    datetime("due_at", false),
    datetime("read_at", false),
    varchar("created_by", 64, false),
  ]);
  await ensureIndex(tableIds.notifications, "notifications_recipient_idx", ["recipient_user_id"]);

  await ensureTable(tableIds.pushSubscriptions, "Push Subscriptions");
  await ensureColumns(tableIds.pushSubscriptions, [
    varchar("firm_id", 64, true),
    varchar("user_id", 64, true),
    varchar("endpoint", 700, true),
    varchar("p256dh", 500, true),
    varchar("auth", 500, true),
    varchar("user_agent", 500, false),
    bool("is_active", true, true),
  ]);
  await ensureIndex(tableIds.pushSubscriptions, "push_user_endpoint_idx", ["user_id", "endpoint"]);
}

async function ensureColumns(tableId, columns) {
  for (const column of columns) {
    await ignoreConflict(() => column.create(tableId), `${tableId}.${column.key}`);
    await waitForColumn(tableId, column.key);
  }
}

async function waitForColumn(tableId, key) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const column = await tables.getColumn({ databaseId, tableId, key });
    if (!column.status || column.status === "available") return;
    if (column.status === "failed") throw new Error(`Column ${tableId}.${key} failed to build`);
    await sleep(1000);
  }
  throw new Error(`Timed out waiting for column ${tableId}.${key}`);
}

async function ensureIndex(tableId, key, columns) {
  await ignoreConflict(
    () =>
      tables.createIndex({
        databaseId,
        tableId,
        key,
        type: TablesDBIndexType.Key,
        columns,
      }),
    `${tableId}.${key}`,
  );
}

async function ensureSeedRows() {
  await upsert(tableIds.firms, seedFirmId, {
    name: process.env.NEXT_PUBLIC_FIRM_NAME || "Demo Mali Musavirlik",
    legal_name: "Demo Mali Musavirlik Ltd.",
    brand_color: "#155E75",
  });

  await upsert(tableIds.clients, seedClientId, {
    firm_id: seedFirmId,
    company_name: "Kara Ticaret A.S.",
    tax_number: "1234567890",
    contact_name: "Mehmet Kara",
    contact_email: "mehmet@example.com",
    contact_phone: "+90 532 000 00 00",
    is_active: true,
  });

  await upsert(tableIds.clients, secondClientId, {
    firm_id: seedFirmId,
    company_name: "Ege Zeytin Gida",
    tax_number: "9876543210",
    contact_name: "Selin Ege",
    contact_email: "selin@example.com",
    contact_phone: "+90 533 000 00 00",
    is_active: true,
  });
}

async function upsert(tableId, rowId, data) {
  await tables.upsertRow({
    databaseId,
    tableId,
    rowId,
    data,
    permissions: [Permission.read(Role.users()), Permission.update(Role.users()), Permission.delete(Role.users())],
  });
  console.log(`seeded ${tableId}.${rowId}`);
}

function varchar(key, size, required, xdefault) {
  return {
    key,
    create: (tableId) =>
      tables.createStringColumn({
        databaseId,
        tableId,
        key,
        size,
        required: xdefault === undefined ? required : false,
        xdefault,
      }),
  };
}

function text(key, required) {
  return { key, create: (tableId) => tables.createTextColumn({ databaseId, tableId, key, required }) };
}

function email(key, required) {
  return { key, create: (tableId) => tables.createEmailColumn({ databaseId, tableId, key, required }) };
}

function bool(key, required, xdefault) {
  return {
    key,
    create: (tableId) =>
      tables.createBooleanColumn({
        databaseId,
        tableId,
        key,
        required: xdefault === undefined ? required : false,
        xdefault,
      }),
  };
}

function integer(key, required, min, max) {
  return {
    key,
    create: (tableId) => tables.createIntegerColumn({ databaseId, tableId, key, required, min, max }),
  };
}

function datetime(key, required) {
  return { key, create: (tableId) => tables.createDatetimeColumn({ databaseId, tableId, key, required }) };
}

function appEnum(key, elements, required, xdefault) {
  return {
    key,
    create: (tableId) =>
      tables.createEnumColumn({
        databaseId,
        tableId,
        key,
        elements,
        required: xdefault === undefined ? required : false,
        xdefault,
      }),
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
