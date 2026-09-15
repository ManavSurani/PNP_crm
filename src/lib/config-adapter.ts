import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const DEFAULT_PORT = 43100;
export const PROGRAM_DATA_ROOT = path.join(
  process.env.ProgramData || "C:\\ProgramData",
  "PNP CRM"
);
export const CONFIG_DIR = path.join(PROGRAM_DATA_ROOT, "config");
export const CONFIG_PATH = path.join(CONFIG_DIR, "app-config.json");
export const DATABASE_DIR = path.join(PROGRAM_DATA_ROOT, "data");
export const DATABASE_PATH = path.join(DATABASE_DIR, "crm.db");
export const UPLOADS_DIR = path.join(PROGRAM_DATA_ROOT, "uploads");
export const LOGS_DIR = path.join(PROGRAM_DATA_ROOT, "logs");
export const BACKUPS_DIR = path.join(PROGRAM_DATA_ROOT, "backups");

export type AppConfig = {
  port: number;
  databaseUrl: string;
  dataDir: string;
  uploadsDir: string;
  logsDir: string;
  backupsDir: string;
  authSecret: string;
  nextAuthSecret: string;
  internalBackupSecret: string;
  backupSecret: string;
  r2?: {
    accountId?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    bucketName?: string;
  };
};

function readEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};
  const values: Record<string, string> = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator < 1) continue;
    const key = trimmed.slice(0, separator).trim();
    const raw = trimmed.slice(separator + 1).trim();
    values[key] = raw.replace(/^(['"])(.*)\1$/, "$2");
  }
  return values;
}

function numericPort(value: unknown): number {
  const port = Number(value);
  return Number.isInteger(port) && port >= 1024 && port <= 65535
    ? port
    : DEFAULT_PORT;
}

export function ensureProgramDataDirectories(): void {
  for (const directory of [
    PROGRAM_DATA_ROOT,
    CONFIG_DIR,
    DATABASE_DIR,
    UPLOADS_DIR,
    LOGS_DIR,
    BACKUPS_DIR,
  ]) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

export function loadAppConfig(projectRoot = process.cwd()): AppConfig {
  const env = {
    ...readEnvFile(path.join(projectRoot, ".env")),
    ...process.env,
  } as Record<string, string | undefined>;

  let stored: Partial<AppConfig> = {};
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      stored = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8")) as Partial<AppConfig>;
    } catch {
      stored = {};
    }
  }

  const databaseUrl =
    stored.databaseUrl ||
    env.DATABASE_URL ||
    `file:${DATABASE_PATH}`;

  return {
    port: numericPort(stored.port || env.PNP_CRM_PORT || env.PORT),
    databaseUrl,
    dataDir: stored.dataDir || PROGRAM_DATA_ROOT,
    uploadsDir: stored.uploadsDir || UPLOADS_DIR,
    logsDir: stored.logsDir || LOGS_DIR,
    backupsDir: stored.backupsDir || BACKUPS_DIR,
    authSecret: stored.authSecret || env.AUTH_SECRET || "",
    nextAuthSecret: stored.nextAuthSecret || env.NEXTAUTH_SECRET || "",
    internalBackupSecret: stored.internalBackupSecret || env.INTERNAL_BACKUP_SECRET || "",
    backupSecret: stored.backupSecret || env.BACKUP_SECRET || "",
    r2: stored.r2 || {
      accountId: env.R2_ACCOUNT_ID,
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      bucketName: env.R2_BUCKET_NAME,
    },
  };
}

export function writeAppConfig(
  input: Partial<AppConfig>,
  projectRoot = process.cwd()
): AppConfig {
  ensureProgramDataDirectories();
  const current = loadAppConfig(projectRoot);
  const next: AppConfig = {
    ...current,
    ...input,
    port: numericPort(input.port || current.port),
    databaseUrl: input.databaseUrl || current.databaseUrl,
    authSecret: input.authSecret || current.authSecret || crypto.randomBytes(32).toString("hex"),
    nextAuthSecret:
      input.nextAuthSecret ||
      current.nextAuthSecret ||
      crypto.randomBytes(32).toString("hex"),
    internalBackupSecret:
      input.internalBackupSecret ||
      current.internalBackupSecret ||
      crypto.randomBytes(32).toString("hex"),
    backupSecret:
      input.backupSecret ||
      current.backupSecret ||
      crypto.randomBytes(32).toString("hex"),
  };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(next, null, 2) + "\n", {
    encoding: "utf8",
    mode: 0o600,
  });
  return next;
}

export function applyConfigToProcess(config = loadAppConfig()): void {
  process.env.PORT = String(config.port);
  process.env.DATABASE_URL = config.databaseUrl;
  process.env.AUTH_SECRET = config.authSecret;
  process.env.NEXTAUTH_SECRET = config.nextAuthSecret;
  process.env.INTERNAL_BACKUP_SECRET = config.internalBackupSecret;
  process.env.BACKUP_SECRET = config.backupSecret;
  process.env.PNP_CRM_DATA_DIR = config.dataDir;
  process.env.PNP_CRM_UPLOADS_DIR = config.uploadsDir;
  process.env.PNP_CRM_LOGS_DIR = config.logsDir;
  process.env.PNP_CRM_BACKUPS_DIR = config.backupsDir;
}

export function isConfigured(): boolean {
  return fs.existsSync(CONFIG_PATH);
}
