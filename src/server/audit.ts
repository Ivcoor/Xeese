import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

type AuditEntry = {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  data?: Prisma.InputJsonValue;
};

// Acepta un cliente de transacción para que el registro se guarde junto con el
// cambio que describe, o no se guarde ninguno de los dos.
export async function writeAudit(entry: AuditEntry, client: Prisma.TransactionClient = db) {
  await client.auditLog.create({ data: entry });
}
