import type { User } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { appendAuditLog } from "@/features/audit/repo";

export type CreatePatientInput = {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  email?: string;
  phone?: string;
};

export function getPatients() {
  return prisma.patient.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}

export function getPatient(id: string) {
  return prisma.patient.findUnique({ where: { id } });
}

export function createPatient(input: CreatePatientInput, actor: User) {
  return prisma.$transaction(async (tx) => {
    const patient = await tx.patient.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        dateOfBirth: input.dateOfBirth,
        email: input.email ?? null,
        phone: input.phone ?? null,
      },
    });
    await appendAuditLog(tx, {
      actorId: actor.id,
      action: "PATIENT_CREATED",
      entityType: "Patient",
      entityId: patient.id,
    });
    return patient;
  });
}
