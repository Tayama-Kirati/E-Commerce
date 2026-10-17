import type { NotificationType } from "@prisma/client";
import { prisma } from "@/app/lib/prisma";
import { sendSms } from "@/app/lib/sms";

type Notify = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  /** Sent after the in-app notification is stored. Failures are logged, never thrown. */
  email?: () => Promise<unknown>;
  sms?: { phone: string | null | undefined; text: string };
};

/**
 * One entry point for user-facing events: stores the in-app notification, then
 * fires the email/SMS side channels without letting their failures break the request.
 */
export async function notify(n: Notify) {
  await prisma.notification.create({
    data: { userId: n.userId, type: n.type, title: n.title, body: n.body },
  });
  const side: Promise<unknown>[] = [];
  if (n.email) side.push(n.email());
  if (n.sms) side.push(sendSms(n.sms.phone, n.sms.text));
  const results = await Promise.allSettled(side);
  for (const r of results) if (r.status === "rejected") console.error("[notify]", r.reason);
}

export async function notifyAdmins(title: string, body: string, type: NotificationType = "SYSTEM") {
  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    select: { id: true },
  });
  if (!admins.length) return;
  await prisma.notification.createMany({ data: admins.map((a) => ({ userId: a.id, type, title, body })) });
}
