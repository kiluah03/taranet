import Link from "next/link";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="brand" aria-label="TARA.NET home">
      <span className="brand-mark">T</span>
      {!compact && <span>TARA<span className="dot">.</span>NET</span>}
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
