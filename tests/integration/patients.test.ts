import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createPatient, getPatient, getPatients } from "@/features/patients/repo";
import { getSeedClinician } from "./setup";

describe("patient repository", () => {
  it("creates and reads back a patient", async () => {
    const actor = await getSeedClinician();
    const created = await createPatient(
      {
        firstName: "Ada",
        lastName: "Lovelace",
        dateOfBirth: new Date("1815-12-10"),
        email: "ada@example.com",
      },
      actor,
    );
    expect(created.id).toBeTruthy();

    const fetched = await getPatient(created.id);
    expect(fetched?.firstName).toBe("Ada");
    expect(fetched?.lastName).toBe("Lovelace");
    expect(fetched?.email).toBe("ada@example.com");
  });

  it("returns patients ordered by last name then first name", async () => {
    const actor = await getSeedClinician();
    await createPatient(
      { firstName: "Bob", lastName: "Smith", dateOfBirth: new Date("1990-01-01") },
      actor,
    );
    await createPatient(
      { firstName: "Alice", lastName: "Smith", dateOfBirth: new Date("1991-01-01") },
      actor,
    );
    await createPatient(
      { firstName: "Carl", lastName: "Adams", dateOfBirth: new Date("1989-01-01") },
      actor,
    );

    const patients = await getPatients();
    expect(patients.map((p) => `${p.lastName}, ${p.firstName}`)).toEqual([
      "Adams, Carl",
      "Smith, Alice",
      "Smith, Bob",
    ]);
  });

  it("stores nullable email and phone as null when not provided", async () => {
    const actor = await getSeedClinician();
    const created = await createPatient(
      { firstName: "Grace", lastName: "Hopper", dateOfBirth: new Date("1906-12-09") },
      actor,
    );
    expect(created.email).toBeNull();
    expect(created.phone).toBeNull();
  });

  it("writes a PATIENT_CREATED audit entry attributed to the actor", async () => {
    const actor = await getSeedClinician();
    const created = await createPatient(
      { firstName: "Ada", lastName: "Lovelace", dateOfBirth: new Date("1815-12-10") },
      actor,
    );

    const audit = await prisma.auditLog.findMany({
      where: { entityType: "Patient", entityId: created.id },
    });
    expect(audit).toHaveLength(1);
    expect(audit[0]?.action).toBe("PATIENT_CREATED");
    expect(audit[0]?.actorId).toBe(actor.id);
  });
});
