"use client";

import { FormEvent, useEffect, useState } from "react";

type SetupStatus = {
  configured: boolean;
  databaseFile: boolean;
  port: number;
  dataDir: string;
  uploadsDir: string;
};

export default function SetupPage() {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [port, setPort] = useState("43100");
  const [r2AccountId, setR2AccountId] = useState("");
  const [r2AccessKeyId, setR2AccessKeyId] = useState("");
  const [r2SecretAccessKey, setR2SecretAccessKey] = useState("");
  const [r2BucketName, setR2BucketName] = useState("pnp-crm-backup");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/setup/status")
      .then((response) => response.json())
      .then((value: SetupStatus) => {
        setStatus(value);
        setPort(String(value.port || 43100));
      })
      .catch(() => setMessage("Unable to read setup status."));
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          port: Number(port),
          r2: r2AccountId && r2AccessKeyId && r2SecretAccessKey
            ? {
                accountId: r2AccountId,
                accessKeyId: r2AccessKeyId,
                secretAccessKey: r2SecretAccessKey,
                bucketName: r2BucketName,
              }
            : undefined,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Setup failed.");
      setMessage("Configuration saved. Restart PNP CRM to use the new port.");
      setStatus((current) =>
        current ? { ...current, configured: true, port: result.port } : current
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Setup failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900 dark:bg-[#090d16] dark:text-white">
      <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-slate-900">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          PNP CRM setup
        </p>
        <h1 className="mt-2 text-2xl font-bold">Windows distribution configuration</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          This additive wizard stores mutable application settings under ProgramData.
          Existing developer .env configuration remains unchanged.
        </p>
        <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-800/70">
          <div>Configuration: {status?.configured ? "Ready" : "Not created"}</div>
          <div>Database file: {status?.databaseFile ? "Present" : "Not initialized"}</div>
          <div className="break-all">Data directory: {status?.dataDir || "Loading..."}</div>
        </div>
        <form onSubmit={save} className="mt-6 space-y-4">
          <label className="block text-sm font-medium">
            Application port
            <input
              required
              min={1024}
              max={65535}
              type="number"
              value={port}
              onChange={(event) => setPort(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
          <details className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <summary className="cursor-pointer text-sm font-medium">Optional Cloudflare R2 backup</summary>
            <div className="mt-3 space-y-3">
              <input value={r2AccountId} onChange={(event) => setR2AccountId(event.target.value)} placeholder="R2 account ID" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" />
              <input value={r2AccessKeyId} onChange={(event) => setR2AccessKeyId(event.target.value)} placeholder="R2 access key ID" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" />
              <input type="password" value={r2SecretAccessKey} onChange={(event) => setR2SecretAccessKey(event.target.value)} placeholder="R2 secret access key" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" />
              <input value={r2BucketName} onChange={(event) => setR2BucketName(event.target.value)} placeholder="R2 bucket name" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" />
            </div>
          </details>
          <button
            disabled={saving}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save configuration"}
          </button>
        </form>
        {message && <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{message}</p>}
      </section>
    </main>
  );
}
