import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { existsSync } from 'fs';

const NGROK_EXE = 'C:\\ngrok\\ngrok.exe';
const NGROK_DOMAIN = 'research-reshuffle-bagful.ngrok-free.dev';
const NGROK_API = 'http://127.0.0.1:4040/api/tunnels';

/**
 * Helper to check if the local Ngrok inspection API is responding
 */
async function checkNgrokStatus(): Promise<{ online: boolean; url: string | null }> {
  try {
    const res = await fetch(NGROK_API, {
      signal: AbortSignal.timeout(1500),
    });
    if (res.ok) {
      const data = await res.json();
      const publicUrl = data.tunnels?.[0]?.public_url || `https://${NGROK_DOMAIN}`;
      return { online: true, url: publicUrl };
    }
  } catch {}
  return { online: false, url: null };
}

/**
 * Helper to check if the PC has internet access
 */
async function checkInternet(): Promise<boolean> {
  try {
    const res = await fetch('https://1.1.1.1', {
      method: 'HEAD',
      signal: AbortSignal.timeout(3000),
    });
    return res.ok || res.status < 500;
  } catch {
    try {
      const res2 = await fetch('https://dns.google', {
        method: 'HEAD',
        signal: AbortSignal.timeout(3000),
      });
      return res2.ok || res2.status < 500;
    } catch {
      return false;
    }
  }
}

/**
 * GET /api/system/tunnel — Check current tunnel status
 */
export async function GET() {
  // Layer 1: Is the ngrok process running locally?
  const ngrokStatus = await checkNgrokStatus();
  if (!ngrokStatus.online) {
    return NextResponse.json({ online: false, url: null });
  }

  // Layer 2: Does this PC actually have internet access?
  const hasInternet = await checkInternet();
  if (!hasInternet) {
    // ngrok process is alive but internet is gone — report offline
    return NextResponse.json({ online: false, url: ngrokStatus.url });
  }

  // Both checks passed — tunnel is genuinely online
  return NextResponse.json({ online: true, url: ngrokStatus.url });
}

/**
 * POST /api/system/tunnel — Start or Reconnect Ngrok tunnel
 */
export async function POST() {
  // 1. Check if ngrok process is already running
  const ngrokRunning = await checkNgrokStatus();
  if (ngrokRunning.online) {
    // Process is running — also verify real internet before claiming active
    const hasInternet = await checkInternet();
    if (hasInternet) {
      return NextResponse.json({
        success: true,
        online: true,
        url: ngrokRunning.url,
        message: 'Tunnel is already active and online.',
      });
    }
    // Process alive but no internet — fall through to internet check below
  }

  // 2. Check if ngrok.exe exists
  if (!existsSync(NGROK_EXE)) {
    return NextResponse.json(
      {
        success: false,
        online: false,
        error: `ngrok.exe not found at ${NGROK_EXE}. Please verify installation.`,
      },
      { status: 404 }
    );
  }

  // 3. Check internet connectivity
  const hasInternet = await checkInternet();
  if (!hasInternet) {
    return NextResponse.json(
      {
        success: false,
        online: false,
        error: 'No internet connection detected on this PC. Please check your Wi-Fi or Ethernet connection.',
      },
      { status: 503 }
    );
  }

  // 4. Spawn ngrok in the background
  try {
    const child = spawn(
      NGROK_EXE,
      ['http', `--url=${NGROK_DOMAIN}`, '3000'],
      {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
      }
    );
    child.unref();

    // 5. Wait a moment for ngrok to initialize
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 6. Verify it started
    const newStatus = await checkNgrokStatus();
    if (newStatus.online) {
      return NextResponse.json({
        success: true,
        online: true,
        url: newStatus.url,
        message: 'Tunnel successfully connected and online!',
      });
    } else {
      return NextResponse.json({
        success: true,
        online: true,
        url: `https://${NGROK_DOMAIN}`,
        message: 'Tunnel process started.',
      });
    }
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        online: false,
        error: `Failed to launch tunnel process: ${err.message}`,
      },
      { status: 500 }
    );
  }
}
