// نظام Toast بسيط للإشعارات
let toastContainer: HTMLDivElement | null = null;

function createToastContainer() {
  if (toastContainer) return toastContainer;

  toastContainer = document.createElement("div");
  toastContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    font-family: 'Cairo', sans-serif;
  `;
  document.body.appendChild(toastContainer);

  return toastContainer;
}

function showToast(
  message: string,
  type: "success" | "error" | "warning" | "info" = "info",
) {
  const container = createToastContainer();

  const toast = document.createElement("div");

  toast.style.cssText = `
    background: ${
      type === "success"
        ? "#10b981"
        : type === "error"
          ? "#ef4444"
          : type === "warning"
            ? "#f59e0b"
            : "#3b82f6"
    };
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    margin-bottom: 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transform: translateX(100%);
    transition: transform 0.3s ease;
    max-width: 300px;
    word-wrap: break-word;
  `;

  toast.textContent = message;
  container.appendChild(toast);

  // إظهار Toast
  setTimeout(() => {
    toast.style.transform = "translateX(0)";
  }, 100);

  // إخفاء Toast بعد 3 ثوان
  setTimeout(() => {
    toast.style.transform = "translateX(100%)";
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

export const toast = {
  success: (message: string) => showToast(message, "success"),
  error: (message: string) => showToast(message, "error"),
  warning: (message: string) => showToast(message, "warning"),
  info: (message: string) => showToast(message, "info"),
};
