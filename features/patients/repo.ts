import { prisma } from "@/lib/prisma";

export type CreatePatientInput = {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  email?: string | null;
  phone?: string | null;
};

export function getPatients() {
  return prisma.patient.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}

export function getPatient(id: string) {
  return prisma.patient.findUnique({ where: { id } });
}

export function createPatient(input: CreatePatientInput) {
  return prisma.patient.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      dateOfBirth: input.dateOfBirth,
      email: input.email ?? null,
      phone: input.phone ?? null,
    },
  });
}
