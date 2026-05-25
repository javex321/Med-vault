import { describe, expect, it, vi } from "vitest";

vi.mock("../../utils/logger.js", () => ({
  logger: {
    info: vi.fn()
  }
}));

const { sendEmail } = await import("./email.service.js");

describe("sendEmail", () => {
  it("processes email payloads with the development-safe JSON transport", async () => {
    await expect(
      sendEmail({
        notificationId: "notification-1",
        to: "patient@example.com",
        subject: "MedVault test email",
        text: "Your secure health timeline is ready.",
        html: "<p>Your secure health timeline is ready.</p>"
      })
    ).resolves.toBeUndefined();
  });
});
