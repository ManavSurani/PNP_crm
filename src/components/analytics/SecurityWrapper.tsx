"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PinModal from "./PinModal";
import { Loader2 } from "lucide-react";

export default function SecurityWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalMode, setModalMode] = useState<"verify" | "setup" | "confirm">("verify");
  const [tempPin, setTempPin] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    checkSecurity();
  }, []);

  const checkSecurity = async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      setSettings(data);

      if (!data.isAnalyticsPinEnabled) {
        setIsUnlocked(true);
      } else {
        const sessionUnlocked = sessionStorage.getItem("analytics_unlocked");
        if (sessionUnlocked === "true") {
          setIsUnlocked(true);
        } else if (!data.analyticsPin) {
          setModalMode("setup");
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinSuccess = async (pin: string) => {
    setError("");
    if (modalMode === "setup") {
      setTempPin(pin);
      setModalMode("confirm");
      return;
    }

    if (modalMode === "confirm") {
      if (pin !== tempPin) {
        setError("Incorrect security PIN");
        return;
      }
      setIsVerifying(true);
      try {
        const res = await fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "analytics-security", pin }),
        });
        if (res.ok) {
          sessionStorage.setItem("analytics_unlocked", "true");
          setIsUnlocked(true);
        } else {
          setError("Failed to save PIN");
        }
      } catch (e) {
        setError("Connection error");
      } finally {
        setIsVerifying(false);
      }
      return;
    }

    // Verify Mode
    setIsVerifying(true);
    try {
      const res = await fetch("/api/analytics/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem("analytics_unlocked", "true");
        setIsUnlocked(true);
      } else {
        setError(data.error || "Incorrect security PIN");
      }
    } catch (e) {
      setError("Connection error");
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center flex-col gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
          <Loader2 className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Initializing Secure Perimeter...</p>
      </div>
    );
  }

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <PinModal
      title={modalMode === "setup" ? "Create Security PIN" : modalMode === "confirm" ? "Confirm Security PIN" : "Enter Security PIN"}
      subtitle={modalMode === "setup" ? "Define a 4-digit PIN to secure financial data." : modalMode === "confirm" ? "Enter the PIN again to confirm." : "Access restricted. Enter your 4-digit PIN."}
      mode={modalMode}
      onSuccess={handlePinSuccess}
      onCancel={() => router.back()}
      error={error}
      isLoading={isVerifying}
    />
  );
}
