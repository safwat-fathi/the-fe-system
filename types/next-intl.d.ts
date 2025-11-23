type Messages = typeof import("../messages/ar.json");

declare global {
  interface IntlMessages extends Messages {}
}

export {};
