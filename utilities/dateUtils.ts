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

  return `${dd}/${mm}/${yyyy} - ${hh}:${min}:${sec}`;
}
