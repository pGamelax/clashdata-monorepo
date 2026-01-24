import { prisma } from "@/lib/prisma";

export class UserRepository {
  async findByEmail({ email }: { email: string }) {
    const user = await prisma.user.findFirst({
      where: {
        email,
      },
    });

    return user;
  }
}
