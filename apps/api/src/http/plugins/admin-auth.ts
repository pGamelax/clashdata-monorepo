import { auth } from "@/auth";
import Elysia from "elysia";
import { betterAuthPlugin } from "./better-auth";

export const adminPlugin = new Elysia({ name: "admin-auth" })
  .use(betterAuthPlugin)
  .macro({
    admin: {
      async resolve({ status, request: { headers } }) {
        const session = await auth.api.getSession({ headers });
        if (!session || session.user.role !== "admin") {
          return status(403, { message: "Forbidden: Admin access required" });
        }

        return {
          adminUser: session.user,
        };
      },
    },
  });
