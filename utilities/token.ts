export const isTokenValid = (token: string | undefined): boolean => {
  if (!token) return false;

  try {
    const base64url = token.split(".")[1];
    const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    const payload = JSON.parse(atob(padded));
    const currentTime = Math.floor(Date.now() / 1000);

    return typeof payload.exp === "number" && payload.exp > currentTime;
  } catch {
    return false;
  }
};
