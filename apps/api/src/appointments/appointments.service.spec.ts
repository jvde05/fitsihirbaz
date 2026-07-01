import { AppointmentsService } from "./appointments.service";
import { PrismaService } from "../prisma/prisma.service";
import {
  AppointmentAccessDeniedError,
  AppointmentNotFoundError,
  ClientNotLinkedError,
} from "./appointments.errors";

function buildAppointmentRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "appt-1",
    clientId: "client-1",
    dietitianId: "dietitian-1",
    scheduledAt: new Date("2026-07-15T14:30:00Z"),
    durationMinutes: 30,
    status: "SCHEDULED",
    meetingLink: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    client: { id: "client-1", userId: "client-user-1", user: { firstName: "Ali", lastName: "Veli" } },
    dietitian: { id: "dietitian-1", userId: "dyt-user-1", user: { firstName: "Ayşe", lastName: "Yılmaz" } },
    ...overrides,
  };
}

describe("AppointmentsService", () => {
  let prisma: {
    clientProfile: { findUnique: jest.Mock };
    dietitianProfile: { findUnique: jest.Mock };
    clientDietitianLink: { findFirst: jest.Mock };
    appointment: { create: jest.Mock; findUnique: jest.Mock; update: jest.Mock; findMany: jest.Mock };
  };
  let service: AppointmentsService;

  beforeEach(() => {
    prisma = {
      clientProfile: { findUnique: jest.fn() },
      dietitianProfile: { findUnique: jest.fn() },
      clientDietitianLink: { findFirst: jest.fn() },
      appointment: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn() },
    };
    service = new AppointmentsService(prisma as unknown as PrismaService);
  });

  describe("create", () => {
    it("bağlı olmayan diyetisyen için ClientNotLinkedError fırlatır", async () => {
      prisma.clientProfile.findUnique.mockResolvedValue({ id: "client-1" });
      prisma.clientDietitianLink.findFirst.mockResolvedValue(null);

      await expect(
        service.create("client-user-1", { dietitianId: "dietitian-1", scheduledAt: "2026-07-15T14:30" }),
      ).rejects.toBeInstanceOf(ClientNotLinkedError);
    });

    it("bağlı diyetisyen için SCHEDULED randevu oluşturur", async () => {
      prisma.clientProfile.findUnique.mockResolvedValue({ id: "client-1" });
      prisma.clientDietitianLink.findFirst.mockResolvedValue({ id: "link-1" });
      prisma.appointment.create.mockResolvedValue(buildAppointmentRow());

      const result = await service.create("client-user-1", {
        dietitianId: "dietitian-1",
        scheduledAt: "2026-07-15T14:30",
      });
      expect(result.status).toBe("SCHEDULED");
      expect(result.counterpartFirstName).toBe("Ayşe");
    });
  });

  describe("updateStatus", () => {
    it("başka bir diyetisyenin randevusu için AppointmentAccessDeniedError fırlatır", async () => {
      prisma.dietitianProfile.findUnique.mockResolvedValue({ id: "dietitian-1" });
      prisma.appointment.findUnique.mockResolvedValue(buildAppointmentRow({ dietitianId: "baska-dietitian" }));

      await expect(
        service.updateStatus("dyt-user-1", { id: "appt-1", status: "COMPLETED" }),
      ).rejects.toBeInstanceOf(AppointmentAccessDeniedError);
      expect(prisma.appointment.update).not.toHaveBeenCalled();
    });

    it("randevu yoksa AppointmentNotFoundError fırlatır", async () => {
      prisma.dietitianProfile.findUnique.mockResolvedValue({ id: "dietitian-1" });
      prisma.appointment.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus("dyt-user-1", { id: "yok", status: "COMPLETED" }),
      ).rejects.toBeInstanceOf(AppointmentNotFoundError);
    });

    it("sahibi olduğu randevunun durumunu günceller", async () => {
      prisma.dietitianProfile.findUnique.mockResolvedValue({ id: "dietitian-1" });
      prisma.appointment.findUnique.mockResolvedValue(buildAppointmentRow());
      prisma.appointment.update.mockResolvedValue(buildAppointmentRow({ status: "COMPLETED" }));

      const result = await service.updateStatus("dyt-user-1", { id: "appt-1", status: "COMPLETED" });
      expect(result.status).toBe("COMPLETED");
    });
  });

  describe("cancel", () => {
    it("başkasının randevusunu iptal etmeye çalışan danışanı reddeder", async () => {
      prisma.appointment.findUnique.mockResolvedValue(buildAppointmentRow());
      prisma.clientProfile.findUnique.mockResolvedValue({ id: "baska-client" });

      await expect(service.cancel("client-user-1", "CLIENT", "appt-1")).rejects.toBeInstanceOf(
        AppointmentAccessDeniedError,
      );
    });

    it("kendi randevusunu iptal edebilir", async () => {
      prisma.appointment.findUnique.mockResolvedValue(buildAppointmentRow());
      prisma.clientProfile.findUnique.mockResolvedValue({ id: "client-1" });
      prisma.appointment.update.mockResolvedValue(buildAppointmentRow({ status: "CANCELLED" }));

      const result = await service.cancel("client-user-1", "CLIENT", "appt-1");
      expect(result.status).toBe("CANCELLED");
    });
  });
});
