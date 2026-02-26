/**
 * Normalize a phone number to E.164 format (+1XXXXXXXXXX).
 * Accepts: (555) 123-4567, 555-123-4567, 5551234567, +15551234567
 */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length > 10) return `+${digits}`;
  return input; // Return as-is if can't normalize
}

/**
 * Format an E.164 phone number for display: (XXX) XXX-XXXX
 */
export function formatPhone(e164: string): string {
  const digits = e164.replace(/\D/g, "");
  const national = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (national.length === 10) {
    return `(${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}`;
  }
  return e164;
}

/**
 * Format currency with consistent styling.
 * style: 'full' → $1,234.56 | 'compact' → $1.2K | 'rate' → $21.00/hr
 */
export function formatCurrency(amount: number, style: "full" | "compact" | "rate" = "full"): string {
  if (style === "compact") {
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
    return `$${amount.toFixed(0)}`;
  }
  if (style === "rate") {
    return `$${amount.toFixed(2)}/hr`;
  }
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format a date/timestamp as relative time or absolute date.
 * Recent: "2 minutes ago", "3 hours ago", "Yesterday"
 * Older: "Jan 15, 2026 at 2:30 PM"
 */
export function formatTimeAgo(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? "s" : ""} ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay} days ago`;

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }) + " at " + d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Valid caregiver status transitions map.
 * Key = current status, Value = array of valid next statuses.
 */
export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  new: ["contacted"],
  contacted: ["intake_started", "new"],
  intake_started: ["enrollment_pending", "contacted"],
  enrollment_pending: ["authorized", "intake_started"],
  authorized: ["active", "enrollment_pending"],
  active: [], // terminal state
};

export function isValidStatusTransition(from: string, to: string): boolean {
  const valid = VALID_STATUS_TRANSITIONS[from];
  return valid ? valid.includes(to) : false;
}
