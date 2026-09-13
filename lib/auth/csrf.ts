import { cookies } from "next/headers";
import { csrfCookie, validCsrf } from "./security";
export async function checkCsrf(request: Request) {
  return validCsrf(request, (await cookies()).get(csrfCookie)?.value);
}
