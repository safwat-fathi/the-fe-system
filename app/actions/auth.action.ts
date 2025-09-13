import { User } from "@/types/models/user.model";
import { setCookieAction, getCookieAction } from "./cookie-store.action";
import { COOKIE_NAMES } from "@/lib/constants";

export async function onLoginAction(data: User, remember = false) {
  const expires = remember
    ? new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) // if user checked remember me, set cookie to expire in 30 days
    : new Date(Date.now() + 1000 * 60 * 60); // else cookie expires in 1 hr

  await setCookieAction(COOKIE_NAMES.TOKEN, data.token, {
    maxAge: expires.getTime() / 1000,
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
  });
}

// export async function onRefreshAction(value: string) {
//   cookies().set({
//     name: "token",
//     value: value,
//     httpOnly: true,
//     ...(remember && {
//       expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
//     }), // if user checked remember me, set cookie to expire in 30 days
//     path: "/",
//   })

//   redirect("/")
// }

export async function getTokenAction() {
  return await getCookieAction(COOKIE_NAMES.TOKEN);
}
