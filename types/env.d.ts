declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production";
      NEXT_PUBLIC_API_BASE_URL: string;
      NEXT_PUBLIC_API_GOLD_PRICE: string;
      NEXT_PUBLIC_GOLD_API_TOKEN: string;
      NEXT_PUBLIC_ACCESS_TOKEN: string;
      NEXT_PUBLIC_REFRESH_TOKEN: string;
      NEXT_PUBLIC_CSRF_COOKIE_NAME: string;
      SESSION_SECRET: string;
      CSRF_SECRET: string;
      WHATSAPP_BASE_URL: string;
      WHATSAPP_TOKEN: string;
      PHONE_NUMBER_ID: string;
      VERIFY_TOKEN: string;
      DATABASE_PROVIDER: string;
      DATABASE_URL: string;
    }
  }
}
