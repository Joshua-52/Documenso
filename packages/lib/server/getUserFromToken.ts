import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@documenso/prisma";
import { getSession } from "../auth";
import { User as PrismaUser } from "@prisma/client";
import { getToken } from "next-auth/jwt";

export async function getUserFromToken(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<PrismaUser | null> {
  const oauthUser = await getSession({ req });

  if (oauthUser) {
    return oauthUser.user as PrismaUser;
  }

  const token = await getToken({ req });
  const tokenEmail = token?.email?.toString();

  if (!token) {
    if (res.status) res.status(401).send("No session token found for request.");
    return null;
  }

  if (!tokenEmail) {
    res.status(400).send("No email found in session token.");
    return null;
  }

  const user = await prisma.user.findFirst({
    where: { email: tokenEmail },
  });

  if (!user) {
    if (res && res.status) res.status(401).end();
    return null;
  }

  return user;
}
