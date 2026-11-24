import Image from "next/image";
import Link from "next/link";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="brand" aria-label="TARANET NZ home">
      <Image className="brand-logo" src="/taranet-logo.jpeg" alt="TARANET NZ — Connecting Kiwinoys" width={64} height={64} priority />
      {!compact && <span className="brand-wordmark">TARANET <span className="dot">NZ</span><small>Connecting Kiwinoys</small></span>}
    </Link>
  );
}

export function StatusPill() {
  return (
    <div className="status-pill">
      <span className="status-dot"><span /></span>
      Core network: 100% operational
    </div>
  );
}
