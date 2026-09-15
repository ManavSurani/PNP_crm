import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const args = new Set(process.argv.slice(2));
if (!args.has("--reset-admin") || !args.has("--confirm=PNP-CRM-RESET")) {
  console.error("Refusing reset. Use --reset-admin --confirm=PNP-CRM-RESET --email=... --password=...");
  process.exit(2);
}

const getArg = (name) => process.argv.find((value) => value.startsWith(`${name}=`))?.slice(name.length + 1);
const email = getArg("--email");
const password = getArg("--password");
if (!email || !password || password.length < 8) {
  console.error("An admin email and password of at least 8 characters are required.");
  process.exit(2);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const programData = path.join(process.env.ProgramData || "C:\\ProgramData", "PNP CRM");
const configPath = path.join(programData, "config", "app-config.json");
if (existsSync(configPath)) {
  const config = JSON.parse(readFileSync(configPath, "utf8"));
  process.env.DATABASE_URL = config.databaseUrl;
  process.env.AUTH_SECRET = config.authSecret;
  process.env.NEXTAUTH_SECRET = config.nextAuthSecret;
}
const envPath = path.join(root, ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const index = line.indexOf("=");
    if (index > 0 && !line.trim().startsWith("#")) {
      process.env[line.slice(0, index).trim()] ||= line.slice(index + 1).trim().replace(/^(['"])(.*)\1$/, "$2");
    }
  }
}

const prisma = new PrismaClient();
try {
  const hash = await bcrypt.hash(password, 12);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    await prisma.user.create({ data: { email, name: "Super Admin", password: hash, role: "ADMIN" } });
  } else {
    await prisma.user.update({ where: { email }, data: { password: hash, role: "ADMIN", failedLoginAttempts: 0, lockedUntil: null } });
  }
  await prisma.session.deleteMany({ where: { user: { email } } });
  console.log(`Admin credentials reset for ${email}.`);
} finally {
  await prisma.$disconnect();
}
