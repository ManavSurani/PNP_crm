import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (
    !accountId || !accessKeyId || !secretAccessKey ||
    accountId === "your_cloudflare_account_id_here"
  ) {
    return null;
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

// GET — Download the latest backup from Cloudflare R2 to the browser
export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const r2 = getR2Client();
  if (!r2) {
    return NextResponse.json(
      { error: "Cloud backup not configured. Please add your R2 credentials to .env" },
      { status: 503 }
    );
  }

  const r2Bucket = process.env.R2_BUCKET_NAME ?? "pnp-crm-backup";

  try {
    const result = await r2.send(new GetObjectCommand({
      Bucket: r2Bucket,
      Key: "latest.pnpcrm",
    }));

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of result.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="PNP-CRM-Cloud-Backup.pnpcrm"`,
      },
    });
  } catch (error: any) {
    if (error.name === "NoSuchKey" || error.$metadata?.httpStatusCode === 404) {
      return NextResponse.json(
        { error: "No cloud backup found yet. Create a backup first." },
        { status: 404 }
      );
    }
    console.error("[Backup Cloud] R2 download failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch cloud backup: " + (error.message ?? "Unknown error") },
      { status: 500 }
    );
  }
}
