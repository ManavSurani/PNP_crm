import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, rmSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import AdmZip from "adm-zip";
import { PrismaClient } from "@prisma/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const programData = path.join(process.env.ProgramData || "C:\\ProgramData", "PNP CRM");
const configPath = path.join(programData, "config", "app-config.json");
const config = existsSync(configPath) ? JSON.parse(readFileSync(configPath, "utf8")) : {};
const dataDir = config.dataDir || path.join(programData, "data");
const envPath = path.join(root, ".env");
const envValues = existsSync(envPath)
  ? Object.fromEntries(readFileSync(envPath, "utf8").split(/\r?\n/).flatMap((line) => {
      const index = line.indexOf("=");
      return index > 0 && !line.trim().startsWith("#")
        ? [[line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^(['"])(.*)\1$/, "$2")]]
        : [];
    }))
  : {};
const databaseUrl = config.databaseUrl || process.env.DATABASE_URL || envValues.DATABASE_URL;
const dbPath = databaseUrl?.replace(/^file:/, "") || path.join(dataDir, "crm.db");
const uploadsDir = config.uploadsDir || path.join(programData, "uploads");
const backupsDir = config.backupsDir || path.join(programData, "backups");
mkdirSync(backupsDir, { recursive: true });

if (!existsSync(dbPath)) throw new Error(`Database not found: ${dbPath}`);
const snapshotPath = path.join(backupsDir, `.snapshot-${process.pid}.db`);
const prisma = new PrismaClient({ datasources: { db: { url: `file:${dbPath}` } } });
try {
  await prisma.$executeRawUnsafe("PRAGMA busy_timeout = 5000");
  const escaped = snapshotPath.replaceAll("'", "''");
  await prisma.$executeRawUnsafe(`VACUUM INTO '${escaped}'`);
} finally {
  await prisma.$disconnect();
}

const zip = new AdmZip();
zip.addLocalFile(snapshotPath, "data", "crm.db");
if (existsSync(configPath)) zip.addLocalFile(configPath, "config");
const uploadManifest = [];
function addUploads(directory, archiveDirectory = "uploads") {
  if (!existsSync(directory)) return;
  for (const name of readdirSync(directory)) {
    const full = path.join(directory, name);
    const archivePath = path.join(archiveDirectory, name);
    if (statSync(full).isDirectory()) addUploads(full, archivePath);
    else {
      zip.addLocalFile(full, archiveDirectory);
      uploadManifest.push(archivePath.replaceAll("\\", "/"));
    }
  }
}
addUploads(uploadsDir);
zip.addFile("manifest.json", Buffer.from(JSON.stringify({
  app: "PNP CRM",
  createdAt: new Date().toISOString(),
  sqlite: { method: "VACUUM INTO", walSafe: true, busyTimeoutMs: 5000 },
  includes: ["data/crm.db", "uploads/*"],
  uploadFiles: uploadManifest,
}, null, 2)));

const plain = zip.toBuffer();
const secret = config.backupSecret || process.env.BACKUP_SECRET || envValues.BACKUP_SECRET;
if (!secret) throw new Error("No backup secret configured.");
const key = crypto.createHash("sha256").update(secret).digest();
const iv = crypto.randomBytes(16);
const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
const encrypted = Buffer.concat([cipher.update(plain), cipher.final()]);
const output = Buffer.concat([Buffer.from("PNPCRMB1"), iv, cipher.getAuthTag(), encrypted]);
const filename = `PNP CRM Backup - ${new Date().toISOString().replaceAll(":", "-")}.pnpcrm`;
const outputPath = path.join(backupsDir, filename);
writeFileSync(outputPath, output);
writeFileSync(path.join(backupsDir, "last-backup.json"), JSON.stringify({ filename, createdAt: new Date().toISOString() }, null, 2));

const r2 = config.r2;
if (r2?.accountId && r2.accessKeyId && r2.secretAccessKey && r2.bucketName) {
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${r2.accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: r2.accessKeyId, secretAccessKey: r2.secretAccessKey },
  });
  await client.send(new PutObjectCommand({
    Bucket: r2.bucketName,
    Key: "latest.pnpcrm",
    Body: output,
    ContentType: "application/octet-stream",
  }));
  console.log("Cloudflare R2 upload complete.");
}

rmSync(snapshotPath, { force: true });
console.log(`Backup created: ${outputPath}`);
