import { z } from "zod";
import { optionalCoerced } from "./common";

export const AppointmentStatusSchema = z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"]);
export type AppointmentStatus = z.infer<typeof AppointmentStatusSchema>;

// "counterpart" alanları görüntüleyen tarafa göre değişir: danışan için diyetisyen bilgisi,
// diyetisyen için danışan bilgisi döner.
export const AppointmentSchema = z.object({
  id: z.string().uuid(),
  clientId: z.string().uuid(),
  dietitianId: z.string().uuid(),
  scheduledAt: z.string(),
  durationMinutes: z.number().int(),
  status: AppointmentStatusSchema,
  meetingLink: z.string().nullable(),
  counterpartFirstName: z.string(),
  counterpartLastName: z.string(),
});
export type Appointment = z.infer<typeof AppointmentSchema>;

export const CreateAppointmentInputSchema = z.object({
  dietitianId: z.string().uuid(),
  scheduledAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "Geçerli bir tarih/saat girin"),
  durationMinutes: optionalCoerced(z.coerce.number().int().positive().max(480)),
  meetingLink: z.string().url().optional(),
});
export type CreateAppointmentInput = z.infer<typeof CreateAppointmentInputSchema>;

export const UpdateAppointmentStatusInputSchema = z.object({
  id: z.string().uuid(),
  status: AppointmentStatusSchema,
});
export type UpdateAppointmentStatusInput = z.infer<typeof UpdateAppointmentStatusInputSchema>;

export const CancelAppointmentInputSchema = z.object({
  id: z.string().uuid(),
});
export type CancelAppointmentInput = z.infer<typeof CancelAppointmentInputSchema>;
