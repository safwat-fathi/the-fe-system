// @/utilities/dateUtils.ts

export function formatDateTime(dateString: string | Date): string {
  if (!dateString) return "";

  const date = new Date(dateString);

  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();

  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const sec = String(date.getSeconds()).padStart(2, "0");

  return `${dd}/${mm}/${yyyy} : ${hh}:${min}:${sec}`;
}

// دالة لتحويل التاريخ والوقت إلى تنسيق input datetime-local
export function toDateTimeLocalFormat(dateString: string | Date): string {
  if (!dateString) return "";

  const date = new Date(dateString);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

// دالة لتحويل من تنسيق datetime-local إلى ISO
export function fromDateTimeLocalFormat(dateTimeLocal: string): string {
  if (!dateTimeLocal) return "";

  return new Date(dateTimeLocal).toISOString();
}
