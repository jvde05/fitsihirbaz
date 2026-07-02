import type { Appointment as AppointmentRow, ClientProfile, DietitianProfile, User } from "@fit-sihirbaz/db";
import type { Appointment, Role } from "@fit-sihirbaz/shared";

type AppointmentWithParties = AppointmentRow & {
  client: ClientProfile & { user: User };
  dietitian: DietitianProfile & { user: User };
};

export function toAppointment(row: AppointmentWithParties, viewerRole: Role): Appointment {
  const counterpartUser = viewerRole === "CLIENT" ? row.dietitian.user : row.client.user;
  return {
    id: row.id,
    clientId: row.clientId,
    dietitianId: row.dietitianId,
    scheduledAt: row.scheduledAt.toISOString(),
    durationMinutes: row.durationMinutes,
    status: row.status,
    meetingLink: row.meetingLink,
    counterpartFirstName: counterpartUser.firstName,
    counterpartLastName: counterpartUser.lastName,
  };
}
