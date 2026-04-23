/* =========================================================
  DATE HELPERS (SAFE FOR BOOKINGS + HOUSEKEEPING)
========================================================= */

export const toLocalDateTime = (value?: string | null) => {
  if (!value) return null;

  const d = new Date(value);
  if (isNaN(d.getTime())) return null;

  return d;
};

export const formatDateTime = (dateString?: string | null) => {
  if (!dateString) return "N/A";

  const date = toLocalDateTime(dateString);
  if (!date) return "N/A";

  return date.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

/* =========================================================
  DEBUG HELPER (DEV ONLY)
========================================================= */
export const formatDebugDate = (label: string, value?: string | null) => {
  if (!value) {
    console.log(`❌ ${label}: NULL`);
    return;
  }

  const d = new Date(value);

  console.log(`🧪 ${label}:`, {
    raw: value,
    parsed: d.toString(),
    iso: d.toISOString(),
    local: d.toLocaleString("en-PH"),
  });
};