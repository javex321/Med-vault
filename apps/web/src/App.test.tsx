import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { App } from "./App";

const authUser = {
  id: "user-1",
  name: "Javed Khan",
  email: "javed.demo@example.com",
  role: "patient",
  status: "active"
};

function createApiResponse(data: unknown) {
  return new Response(
    JSON.stringify({
      success: true,
      requestId: "test-request-id",
      data
    }),
    {
      headers: {
        "Content-Type": "application/json"
      },
      status: 200
    }
  );
}

function createApiError(status: number, message: string) {
  return new Response(
    JSON.stringify({
      success: false,
      requestId: "test-request-id",
      error: {
        code: "TEST_ERROR",
        message
      }
    }),
    {
      headers: {
        "Content-Type": "application/json"
      },
      status
    }
  );
}

function stubAuthenticatedApi(healthStatus: "ok" | "degraded" = "ok", withLiveDashboardData = false) {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/auth/me")) {
        return Promise.resolve(createApiResponse({ user: authUser }));
      }

      if (url.includes("/health")) {
        return Promise.resolve(
          createApiResponse({
            status: healthStatus,
            service: "api",
            timestamp: new Date("2026-05-18T00:00:00.000Z").toISOString(),
            uptime: 42,
            dependencies: {
              mongo: healthStatus === "ok" ? "connected" : "disconnected",
              redis: healthStatus === "ok" ? "connected" : "disconnected"
            }
          })
        );
      }

      if (withLiveDashboardData && url.includes("/timeline-events")) {
        return Promise.resolve(
          createApiResponse({
            events: [
              {
                id: "event-1",
                ownerId: "user-1",
                profileId: "profile-1",
                type: "visit",
                title: "Annual checkup",
                occurredAt: "2026-05-21T09:00:00.000Z",
                providerName: "Dr. Sharma",
                facilityName: "City Clinic",
                summary: "Routine checkup with normal vitals.",
                tags: ["checkup", "primary-care"],
                source: "manual",
                sensitivity: "normal",
                createdAt: "2026-05-20T18:32:39.184Z",
                updatedAt: "2026-05-20T18:32:39.184Z"
              }
            ],
            pagination: { page: 1, limit: 50, total: 1, totalPages: 1 }
          })
        );
      }

      if (withLiveDashboardData && url.includes("/medications")) {
        return Promise.resolve(
          createApiResponse({
            medications: [
              {
                id: "medication-1",
                ownerId: "user-1",
                profileId: "profile-1",
                name: "Metformin",
                genericName: "Metformin",
                form: "tablet",
                route: "oral",
                strength: "500mg",
                reason: "Blood sugar control",
                prescribingClinician: "Dr. Sharma",
                status: "active",
                schedule: {
                  doseAmount: 1,
                  doseUnit: "tablet",
                  frequency: "twice_daily",
                  timesOfDay: ["08:00", "20:00"],
                  daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
                  startDate: "2026-05-21",
                  timezone: "Asia/Kolkata",
                  instructions: "Take after meals"
                },
                reminders: { enabled: true, leadTimeMinutes: 15 },
                adherenceLogs: [],
                createdAt: "2026-05-20T18:32:39.184Z",
                updatedAt: "2026-05-20T18:32:39.184Z"
              }
            ],
            pagination: { page: 1, limit: 50, total: 1, totalPages: 1 }
          })
        );
      }

      if (withLiveDashboardData && url.endsWith("/patient-profiles")) {
        return Promise.resolve(
          createApiResponse({
            profiles: [
              {
                id: "profile-1",
                ownerId: "user-1",
                relationshipToOwner: "self",
                fullName: "Javed Demo",
                dateOfBirth: "2002-08-10T00:00:00.000Z",
                sexAtBirth: "male",
                bloodGroup: "O+",
                heightCm: 175,
                weightKg: 70,
                allergies: [] as Array<{ name: string; severity: "mild" | "moderate" | "severe" | "unknown" }>,
                chronicConditions: ["Asthma"],
                emergencyContacts: [],
                createdAt: "2026-05-20T18:32:39.184Z",
                updatedAt: "2026-05-20T18:32:39.184Z"
              }
            ]
          })
        );
      }

      return Promise.resolve(createApiResponse({ profiles: [] }));
    })
  );
}

function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}

afterEach(() => {
  window.history.replaceState(null, "", "/");
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("MedVault dashboard", () => {
  it("renders the login page when there is no authenticated session", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);

        if (url.includes("/auth/me")) {
          return Promise.resolve(createApiError(401, "Authentication required"));
        }

        return Promise.resolve(createApiResponse({}));
      })
    );

    renderApp();

    expect(await screen.findByRole("heading", { name: "Login to your vault" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login to medvault/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /register/i })).toBeInTheDocument();
  });

  it("refreshes an expired access session before rendering the dashboard", async () => {
    let authMeCalls = 0;
    let refreshCalls = 0;

    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);

        if (url.includes("/auth/me")) {
          authMeCalls += 1;

          if (authMeCalls === 1) {
            return Promise.resolve(createApiError(401, "Authentication required"));
          }

          return Promise.resolve(createApiResponse({ user: authUser }));
        }

        if (url.includes("/auth/refresh")) {
          refreshCalls += 1;
          return Promise.resolve(createApiResponse({ user: authUser }));
        }

        if (url.includes("/health")) {
          return Promise.resolve(
            createApiResponse({
              status: "ok",
              service: "api",
              timestamp: new Date("2026-05-18T00:00:00.000Z").toISOString(),
              uptime: 42,
              dependencies: { mongo: "connected", redis: "connected" }
            })
          );
        }

        if (url.endsWith("/patient-profiles")) {
          return Promise.resolve(createApiResponse({ profiles: [] }));
        }

        return Promise.resolve(
          createApiResponse({
            events: [],
            medications: [],
            pagination: { page: 1, limit: 50, total: 0, totalPages: 0 }
          })
        );
      })
    );

    renderApp();

    expect(await screen.findByRole("heading", { name: "Overview" })).toBeInTheDocument();
    expect(authMeCalls).toBe(2);
    expect(refreshCalls).toBe(1);
  });

  it("renders the dashboard shell and API health panel for an authenticated user", async () => {
    stubAuthenticatedApi("ok", true);

    renderApp();

    expect(await screen.findByRole("heading", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getByText("Signed in as")).toBeInTheDocument();
    expect(screen.getByText("Javed Khan")).toBeInTheDocument();
    expect(await screen.findByText("Javed Demo")).toBeInTheDocument();
    expect(await screen.findByText("Metformin")).toBeInTheDocument();
    expect(await screen.findByText("Routine checkup with normal vitals.")).toBeInTheDocument();
    expect(screen.getByText("Recent timeline")).toBeInTheDocument();
    expect(await screen.findByText("API health")).toBeInTheDocument();
    expect(await screen.findAllByText("connected")).toHaveLength(2);
  });

  it("creates a patient profile from the dashboard form", async () => {
    let profileCreated = false;
    let capturedBody: unknown;

    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

        if (url.includes("/auth/me")) {
          return Promise.resolve(createApiResponse({ user: authUser }));
        }

        if (url.includes("/health")) {
          return Promise.resolve(
            createApiResponse({
              status: "ok",
              service: "api",
              timestamp: new Date("2026-05-18T00:00:00.000Z").toISOString(),
              uptime: 42,
              dependencies: { mongo: "connected", redis: "connected" }
            })
          );
        }

        if (url.endsWith("/patient-profiles") && init?.method === "POST") {
          capturedBody = JSON.parse(String(init.body));
          profileCreated = true;

          return Promise.resolve(
            createApiResponse({
              profile: {
                id: "profile-created",
                ownerId: "user-1",
                relationshipToOwner: "self",
                fullName: "Website Patient",
                dateOfBirth: "2001-01-15T00:00:00.000Z",
                sexAtBirth: "male",
                bloodGroup: "O+",
                heightCm: 180,
                weightKg: 75,
                allergies: [{ name: "Peanuts", severity: "unknown" }],
                chronicConditions: ["Asthma"],
                emergencyContacts: [],
                primaryPhysicianName: "Dr. Sharma",
                notes: "Created from UI",
                createdAt: "2026-05-20T18:32:39.184Z",
                updatedAt: "2026-05-20T18:32:39.184Z"
              }
            })
          );
        }

        if (url.endsWith("/patient-profiles")) {
          return Promise.resolve(
            createApiResponse({
              profiles: profileCreated
                ? [
                    {
                      id: "profile-created",
                      ownerId: "user-1",
                      relationshipToOwner: "self",
                      fullName: "Website Patient",
                      dateOfBirth: "2001-01-15T00:00:00.000Z",
                      sexAtBirth: "male",
                      bloodGroup: "O+",
                      heightCm: 180,
                      weightKg: 75,
                      allergies: [{ name: "Peanuts", severity: "unknown" }],
                      chronicConditions: ["Asthma"],
                      emergencyContacts: [],
                      primaryPhysicianName: "Dr. Sharma",
                      notes: "Created from UI",
                      createdAt: "2026-05-20T18:32:39.184Z",
                      updatedAt: "2026-05-20T18:32:39.184Z"
                    }
                  ]
                : []
            })
          );
        }

        return Promise.resolve(
          createApiResponse({
            events: [],
            medications: [],
            pagination: { page: 1, limit: 50, total: 0, totalPages: 0 }
          })
        );
      })
    );

    renderApp();

    await screen.findByRole("heading", { name: "Overview" });
    await userEvent.click(screen.getByRole("button", { name: "Add profile" }));

    await userEvent.type(screen.getByLabelText("Full name"), "Website Patient");
    await userEvent.type(screen.getByLabelText("Date of birth"), "2001-01-15");
    await userEvent.selectOptions(screen.getByLabelText("Sex at birth"), "male");
    await userEvent.selectOptions(screen.getByLabelText("Blood group"), "O+");
    await userEvent.type(screen.getByLabelText("Height in cm"), "180");
    await userEvent.type(screen.getByLabelText("Weight in kg"), "75");
    await userEvent.type(screen.getByLabelText(/Chronic conditions/), "Asthma");
    await userEvent.type(screen.getByLabelText(/Allergies/), "Peanuts");
    await userEvent.type(screen.getByLabelText("Primary physician"), "Dr. Sharma");
    await userEvent.type(screen.getByLabelText("Notes"), "Created from UI");
    await userEvent.click(screen.getByRole("button", { name: "Save patient profile" }));

    expect(await screen.findByText("Website Patient")).toBeInTheDocument();
    expect(capturedBody).toMatchObject({
      relationshipToOwner: "self",
      fullName: "Website Patient",
      dateOfBirth: "2001-01-15",
      sexAtBirth: "male",
      bloodGroup: "O+",
      heightCm: 180,
      weightKg: 75,
      allergies: [{ name: "Peanuts", severity: "unknown" }],
      chronicConditions: ["Asthma"],
      emergencyContacts: [],
      primaryPhysicianName: "Dr. Sharma",
      notes: "Created from UI"
    });
  });
  it("edits and deletes a patient profile from the dashboard", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    let profile = {
      id: "profile-1",
      ownerId: "user-1",
      relationshipToOwner: "self",
      fullName: "Javed Demo",
      dateOfBirth: "2002-08-10T00:00:00.000Z",
      sexAtBirth: "male",
      bloodGroup: "O+",
      heightCm: 175,
      weightKg: 70,
      allergies: [] as Array<{ name: string; severity: "mild" | "moderate" | "severe" | "unknown" }>,
      chronicConditions: ["Asthma"],
      emergencyContacts: [],
      primaryPhysicianName: "Dr. Sharma",
      notes: "Initial profile",
      createdAt: "2026-05-20T18:32:39.184Z",
      updatedAt: "2026-05-20T18:32:39.184Z"
    };
    let capturedPatchBody: unknown;
    let capturedDeleteUrl = "";

    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

        if (url.includes("/auth/me")) {
          return Promise.resolve(createApiResponse({ user: authUser }));
        }

        if (url.includes("/health")) {
          return Promise.resolve(
            createApiResponse({
              status: "ok",
              service: "api",
              timestamp: new Date("2026-05-18T00:00:00.000Z").toISOString(),
              uptime: 42,
              dependencies: { mongo: "connected", redis: "connected" }
            })
          );
        }

        if (url.includes("/patient-profiles/profile-1") && init?.method === "PATCH") {
          capturedPatchBody = JSON.parse(String(init.body));
          profile = {
            ...profile,
            fullName: "Javed Updated",
            bloodGroup: "A+",
            heightCm: 180,
            weightKg: 75,
            chronicConditions: ["Asthma", "Diabetes"],
            allergies: [{ name: "Peanuts", severity: "unknown" }],
            primaryPhysicianName: "Dr. Rao",
            notes: "Updated from dashboard",
            updatedAt: "2026-05-21T10:00:00.000Z"
          };

          return Promise.resolve(createApiResponse({ profile }));
        }

        if (url.includes("/patient-profiles/profile-1") && init?.method === "DELETE") {
          capturedDeleteUrl = url;
          profile = undefined as unknown as typeof profile;

          return Promise.resolve(createApiResponse({ deleted: true }));
        }

        if (url.endsWith("/patient-profiles")) {
          return Promise.resolve(createApiResponse({ profiles: profile ? [profile] : [] }));
        }

        if (url.includes("/timeline-events")) {
          return Promise.resolve(
            createApiResponse({
              events: [],
              pagination: { page: 1, limit: 50, total: 0, totalPages: 0 }
            })
          );
        }

        if (url.includes("/medications")) {
          return Promise.resolve(
            createApiResponse({
              medications: [],
              pagination: { page: 1, limit: 50, total: 0, totalPages: 0 }
            })
          );
        }

        return Promise.resolve(createApiResponse({}));
      })
    );

    renderApp();

    await screen.findByRole("heading", { name: "Overview" });
    expect(await screen.findByText("Javed Demo")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Edit profile" }));

    const nameInput = screen.getByLabelText("Full name");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Javed Updated");
    await userEvent.selectOptions(screen.getByLabelText("Blood group"), "A+");

    const heightInput = screen.getByLabelText("Height in cm");
    await userEvent.clear(heightInput);
    await userEvent.type(heightInput, "180");

    const weightInput = screen.getByLabelText("Weight in kg");
    await userEvent.clear(weightInput);
    await userEvent.type(weightInput, "75");

    const conditionsInput = screen.getByLabelText(/Chronic conditions/);
    await userEvent.clear(conditionsInput);
    await userEvent.type(conditionsInput, "Asthma, Diabetes");

    const allergiesInput = screen.getByLabelText(/Allergies/);
    await userEvent.clear(allergiesInput);
    await userEvent.type(allergiesInput, "Peanuts");

    const physicianInput = screen.getByLabelText("Primary physician");
    await userEvent.clear(physicianInput);
    await userEvent.type(physicianInput, "Dr. Rao");

    const notesInput = screen.getByLabelText("Notes");
    await userEvent.clear(notesInput);
    await userEvent.type(notesInput, "Updated from dashboard");
    await userEvent.click(screen.getByRole("button", { name: "Update patient profile" }));

    expect(await screen.findByText("Javed Updated")).toBeInTheDocument();
    expect(capturedPatchBody).toMatchObject({
      relationshipToOwner: "self",
      fullName: "Javed Updated",
      dateOfBirth: "2002-08-10",
      sexAtBirth: "male",
      bloodGroup: "A+",
      heightCm: 180,
      weightKg: 75,
      allergies: [{ name: "Peanuts", severity: "unknown" }],
      chronicConditions: ["Asthma", "Diabetes"],
      emergencyContacts: [],
      primaryPhysicianName: "Dr. Rao",
      notes: "Updated from dashboard"
    });

    await userEvent.click(screen.getByRole("button", { name: "Delete profile" }));

    expect(confirmSpy).toHaveBeenCalledWith(
      "Delete Javed Updated? This archives the profile and hides its active timeline and medication data."
    );
    expect(capturedDeleteUrl).toContain("/patient-profiles/profile-1");
    expect(await screen.findByText("No patient profile created yet")).toBeInTheDocument();
  });

  it("creates a timeline event from the dashboard form", async () => {
    let eventCreated = false;
    let capturedBody: unknown;

    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

        if (url.includes("/auth/me")) {
          return Promise.resolve(createApiResponse({ user: authUser }));
        }

        if (url.includes("/health")) {
          return Promise.resolve(
            createApiResponse({
              status: "ok",
              service: "api",
              timestamp: new Date("2026-05-18T00:00:00.000Z").toISOString(),
              uptime: 42,
              dependencies: { mongo: "connected", redis: "connected" }
            })
          );
        }

        if (url.endsWith("/patient-profiles")) {
          return Promise.resolve(
            createApiResponse({
              profiles: [
                {
                  id: "profile-1",
                  ownerId: "user-1",
                  relationshipToOwner: "self",
                  fullName: "Javed Demo",
                  dateOfBirth: "2002-08-10T00:00:00.000Z",
                  sexAtBirth: "male",
                  bloodGroup: "O+",
                  heightCm: 175,
                  weightKg: 70,
                  allergies: [] as Array<{ name: string; severity: "mild" | "moderate" | "severe" | "unknown" }>,
                  chronicConditions: ["Asthma"],
                  emergencyContacts: [],
                  createdAt: "2026-05-20T18:32:39.184Z",
                  updatedAt: "2026-05-20T18:32:39.184Z"
                }
              ]
            })
          );
        }

        if (url.includes("/timeline-events") && init?.method === "POST") {
          capturedBody = JSON.parse(String(init.body));
          eventCreated = true;

          return Promise.resolve(
            createApiResponse({
              event: {
                id: "event-created",
                ownerId: "user-1",
                profileId: "profile-1",
                type: "visit",
                title: "Website checkup",
                occurredAt: "2026-05-21T09:00:00.000Z",
                providerName: "Dr. Sharma",
                facilityName: "City Clinic",
                summary: "Created from the dashboard form.",
                tags: ["checkup", "ui"],
                source: "manual",
                sensitivity: "normal",
                createdAt: "2026-05-20T18:32:39.184Z",
                updatedAt: "2026-05-20T18:32:39.184Z"
              }
            })
          );
        }

        if (url.includes("/timeline-events")) {
          return Promise.resolve(
            createApiResponse({
              events: eventCreated
                ? [
                    {
                      id: "event-created",
                      ownerId: "user-1",
                      profileId: "profile-1",
                      type: "visit",
                      title: "Website checkup",
                      occurredAt: "2026-05-21T09:00:00.000Z",
                      providerName: "Dr. Sharma",
                      facilityName: "City Clinic",
                      summary: "Created from the dashboard form.",
                      tags: ["checkup", "ui"],
                      source: "manual",
                      sensitivity: "normal",
                      createdAt: "2026-05-20T18:32:39.184Z",
                      updatedAt: "2026-05-20T18:32:39.184Z"
                    }
                  ]
                : [],
              pagination: { page: 1, limit: 50, total: eventCreated ? 1 : 0, totalPages: eventCreated ? 1 : 0 }
            })
          );
        }

        if (url.includes("/medications")) {
          return Promise.resolve(
            createApiResponse({
              medications: [],
              pagination: { page: 1, limit: 50, total: 0, totalPages: 0 }
            })
          );
        }

        return Promise.resolve(createApiResponse({}));
      })
    );

    renderApp();

    await screen.findByRole("heading", { name: "Overview" });
    await userEvent.click(screen.getByRole("button", { name: "Add timeline" }));

    await userEvent.type(screen.getByLabelText("Title"), "Website checkup");
    await userEvent.clear(screen.getByLabelText("Event date"));
    await userEvent.type(screen.getByLabelText("Event date"), "2026-05-21");
    await userEvent.clear(screen.getByLabelText("Event time"));
    await userEvent.type(screen.getByLabelText("Event time"), "09:00");
    await userEvent.type(screen.getByLabelText("Provider name"), "Dr. Sharma");
    await userEvent.type(screen.getByLabelText("Facility name"), "City Clinic");
    await userEvent.type(screen.getByLabelText("Summary"), "Created from the dashboard form.");
    await userEvent.type(screen.getByLabelText(/Tags/), "checkup, ui");
    await userEvent.click(screen.getByRole("button", { name: "Save timeline event" }));

    expect(await screen.findByText("Website checkup")).toBeInTheDocument();
    expect(capturedBody).toMatchObject({
      type: "visit",
      title: "Website checkup",
      providerName: "Dr. Sharma",
      facilityName: "City Clinic",
      summary: "Created from the dashboard form.",
      tags: ["checkup", "ui"],
      source: "manual",
      sensitivity: "normal"
    });
    expect(capturedBody).toHaveProperty("occurredAt", expect.any(String));
  });
  it("edits and deletes a timeline event from the dashboard", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    let timelineEvent = {
      id: "event-1",
      ownerId: "user-1",
      profileId: "profile-1",
      type: "visit",
      title: "Annual checkup",
      occurredAt: "2026-05-21T09:00:00.000Z",
      providerName: "Dr. Sharma",
      facilityName: "City Clinic",
      summary: "Routine checkup with normal vitals.",
      tags: ["checkup", "primary-care"],
      source: "manual",
      sensitivity: "normal",
      createdAt: "2026-05-20T18:32:39.184Z",
      updatedAt: "2026-05-20T18:32:39.184Z"
    };
    let capturedPatchBody: unknown;
    let capturedDeleteUrl = "";

    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

        if (url.includes("/auth/me")) {
          return Promise.resolve(createApiResponse({ user: authUser }));
        }

        if (url.includes("/health")) {
          return Promise.resolve(
            createApiResponse({
              status: "ok",
              service: "api",
              timestamp: new Date("2026-05-18T00:00:00.000Z").toISOString(),
              uptime: 42,
              dependencies: { mongo: "connected", redis: "connected" }
            })
          );
        }

        if (url.endsWith("/patient-profiles")) {
          return Promise.resolve(
            createApiResponse({
              profiles: [
                {
                  id: "profile-1",
                  ownerId: "user-1",
                  relationshipToOwner: "self",
                  fullName: "Javed Demo",
                  dateOfBirth: "2002-08-10T00:00:00.000Z",
                  sexAtBirth: "male",
                  bloodGroup: "O+",
                  heightCm: 175,
                  weightKg: 70,
                  allergies: [] as Array<{ name: string; severity: "mild" | "moderate" | "severe" | "unknown" }>,
                  chronicConditions: ["Asthma"],
                  emergencyContacts: [],
                  createdAt: "2026-05-20T18:32:39.184Z",
                  updatedAt: "2026-05-20T18:32:39.184Z"
                }
              ]
            })
          );
        }

        if (url.includes("/timeline-events/event-1") && init?.method === "PATCH") {
          capturedPatchBody = JSON.parse(String(init.body));
          timelineEvent = {
            ...timelineEvent,
            title: "Updated checkup",
            occurredAt: "2026-05-22T10:30:00.000Z",
            providerName: "Dr. Rao",
            summary: "Updated from the dashboard.",
            tags: ["updated", "ui"],
            updatedAt: "2026-05-21T10:00:00.000Z"
          };

          return Promise.resolve(createApiResponse({ event: timelineEvent }));
        }

        if (url.includes("/timeline-events/event-1") && init?.method === "DELETE") {
          capturedDeleteUrl = url;
          timelineEvent = undefined as unknown as typeof timelineEvent;

          return Promise.resolve(createApiResponse({ deleted: true }));
        }

        if (url.includes("/timeline-events")) {
          return Promise.resolve(
            createApiResponse({
              events: timelineEvent ? [timelineEvent] : [],
              pagination: { page: 1, limit: 50, total: timelineEvent ? 1 : 0, totalPages: timelineEvent ? 1 : 0 }
            })
          );
        }

        if (url.includes("/medications")) {
          return Promise.resolve(
            createApiResponse({
              medications: [],
              pagination: { page: 1, limit: 50, total: 0, totalPages: 0 }
            })
          );
        }

        return Promise.resolve(createApiResponse({}));
      })
    );

    renderApp();

    await screen.findByRole("heading", { name: "Overview" });
    expect(await screen.findByText("Annual checkup")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Edit Annual checkup" }));
    const titleInput = screen.getByLabelText("Title");
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, "Updated checkup");

    await userEvent.clear(screen.getByLabelText("Event date"));
    await userEvent.type(screen.getByLabelText("Event date"), "2026-05-22");
    await userEvent.clear(screen.getByLabelText("Event time"));
    await userEvent.type(screen.getByLabelText("Event time"), "10:30");

    const providerInput = screen.getByLabelText("Provider name");
    await userEvent.clear(providerInput);
    await userEvent.type(providerInput, "Dr. Rao");

    const summaryInput = screen.getByLabelText("Summary");
    await userEvent.clear(summaryInput);
    await userEvent.type(summaryInput, "Updated from the dashboard.");

    const tagsInput = screen.getByLabelText(/Tags/);
    await userEvent.clear(tagsInput);
    await userEvent.type(tagsInput, "updated, ui");
    await userEvent.click(screen.getByRole("button", { name: "Update timeline event" }));

    expect(await screen.findByText("Updated checkup")).toBeInTheDocument();
    expect(capturedPatchBody).toMatchObject({
      type: "visit",
      title: "Updated checkup",
      providerName: "Dr. Rao",
      summary: "Updated from the dashboard.",
      tags: ["updated", "ui"],
      source: "manual",
      sensitivity: "normal"
    });
    expect(capturedPatchBody).toHaveProperty("occurredAt", expect.any(String));

    await userEvent.click(screen.getByRole("button", { name: "Delete Updated checkup" }));

    expect(confirmSpy).toHaveBeenCalledWith(
      "Delete Updated checkup? This archives the event and removes it from the active timeline."
    );
    expect(capturedDeleteUrl).toContain("/patient-profiles/profile-1/timeline-events/event-1");
    expect(await screen.findByText("No timeline events found yet. Use Add timeline to create one from the dashboard.")).toBeInTheDocument();
  });

  it("creates a medication from the dashboard form", async () => {
    let medicationCreated = false;
    let capturedBody: unknown;

    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

        if (url.includes("/auth/me")) {
          return Promise.resolve(createApiResponse({ user: authUser }));
        }

        if (url.includes("/health")) {
          return Promise.resolve(
            createApiResponse({
              status: "ok",
              service: "api",
              timestamp: new Date("2026-05-18T00:00:00.000Z").toISOString(),
              uptime: 42,
              dependencies: { mongo: "connected", redis: "connected" }
            })
          );
        }

        if (url.endsWith("/patient-profiles")) {
          return Promise.resolve(
            createApiResponse({
              profiles: [
                {
                  id: "profile-1",
                  ownerId: "user-1",
                  relationshipToOwner: "self",
                  fullName: "Javed Demo",
                  dateOfBirth: "2002-08-10T00:00:00.000Z",
                  sexAtBirth: "male",
                  bloodGroup: "O+",
                  heightCm: 175,
                  weightKg: 70,
                  allergies: [] as Array<{ name: string; severity: "mild" | "moderate" | "severe" | "unknown" }>,
                  chronicConditions: ["Asthma"],
                  emergencyContacts: [],
                  createdAt: "2026-05-20T18:32:39.184Z",
                  updatedAt: "2026-05-20T18:32:39.184Z"
                }
              ]
            })
          );
        }

        if (url.includes("/medications") && init?.method === "POST") {
          capturedBody = JSON.parse(String(init.body));
          medicationCreated = true;

          return Promise.resolve(
            createApiResponse({
              medication: {
                id: "medication-created",
                ownerId: "user-1",
                profileId: "profile-1",
                name: "Aspirin",
                genericName: "Acetylsalicylic acid",
                form: "tablet",
                route: "oral",
                strength: "81mg",
                reason: "Heart protection",
                prescribingClinician: "Dr. Sharma",
                status: "active",
                schedule: {
                  doseAmount: 1,
                  doseUnit: "tablet",
                  frequency: "once_daily",
                  timesOfDay: ["08:00"],
                  daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
                  startDate: "2026-05-21",
                  timezone: "Asia/Kolkata",
                  instructions: "Take after breakfast"
                },
                reminders: { enabled: true, leadTimeMinutes: 15 },
                adherenceLogs: [],
                createdAt: "2026-05-20T18:32:39.184Z",
                updatedAt: "2026-05-20T18:32:39.184Z"
              }
            })
          );
        }

        if (url.includes("/medications")) {
          return Promise.resolve(
            createApiResponse({
              medications: medicationCreated
                ? [
                    {
                      id: "medication-created",
                      ownerId: "user-1",
                      profileId: "profile-1",
                      name: "Aspirin",
                      genericName: "Acetylsalicylic acid",
                      form: "tablet",
                      route: "oral",
                      strength: "81mg",
                      reason: "Heart protection",
                      prescribingClinician: "Dr. Sharma",
                      status: "active",
                      schedule: {
                        doseAmount: 1,
                        doseUnit: "tablet",
                        frequency: "once_daily",
                        timesOfDay: ["08:00"],
                        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
                        startDate: "2026-05-21",
                        timezone: "Asia/Kolkata",
                        instructions: "Take after breakfast"
                      },
                      reminders: { enabled: true, leadTimeMinutes: 15 },
                      adherenceLogs: [],
                      createdAt: "2026-05-20T18:32:39.184Z",
                      updatedAt: "2026-05-20T18:32:39.184Z"
                    }
                  ]
                : [],
              pagination: { page: 1, limit: 50, total: medicationCreated ? 1 : 0, totalPages: medicationCreated ? 1 : 0 }
            })
          );
        }

        if (url.includes("/timeline-events")) {
          return Promise.resolve(
            createApiResponse({
              events: [],
              pagination: { page: 1, limit: 50, total: 0, totalPages: 0 }
            })
          );
        }

        return Promise.resolve(createApiResponse({}));
      })
    );

    renderApp();

    await screen.findByRole("heading", { name: "Overview" });
    await userEvent.click(screen.getByRole("button", { name: "Add medication" }));

    await userEvent.type(screen.getByLabelText("Medication name"), "Aspirin");
    await userEvent.type(screen.getByLabelText("Generic name"), "Acetylsalicylic acid");
    await userEvent.type(screen.getByLabelText("Strength"), "81mg");
    await userEvent.type(screen.getByLabelText("Reason"), "Heart protection");
    await userEvent.type(screen.getByLabelText("Prescribing clinician"), "Dr. Sharma");
    await userEvent.clear(screen.getByLabelText("Start date"));
    await userEvent.type(screen.getByLabelText("Start date"), "2026-05-21");
    await userEvent.clear(screen.getByLabelText("Times of day"));
    await userEvent.type(screen.getByLabelText("Times of day"), "08:00");
    await userEvent.type(screen.getByLabelText("Instructions"), "Take after breakfast");
    await userEvent.click(screen.getByLabelText("Enable reminders"));
    await userEvent.click(screen.getByRole("button", { name: "Save medication" }));

    expect(await screen.findByText("Aspirin")).toBeInTheDocument();
    expect(capturedBody).toMatchObject({
      name: "Aspirin",
      genericName: "Acetylsalicylic acid",
      form: "tablet",
      route: "oral",
      strength: "81mg",
      reason: "Heart protection",
      prescribingClinician: "Dr. Sharma",
      status: "active",
      schedule: {
        doseAmount: 1,
        doseUnit: "tablet",
        frequency: "once_daily",
        timesOfDay: ["08:00"],
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        startDate: "2026-05-21",
        timezone: "Asia/Kolkata",
        instructions: "Take after breakfast"
      },
      reminders: { enabled: true, leadTimeMinutes: 15 }
    });
  });

  it("edits and deletes a medication from the dashboard", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    let medication = {
      id: "medication-1",
      ownerId: "user-1",
      profileId: "profile-1",
      name: "Aspirin",
      genericName: "Acetylsalicylic acid",
      form: "tablet",
      route: "oral",
      strength: "81mg",
      reason: "Heart protection",
      prescribingClinician: "Dr. Sharma",
      status: "active",
      schedule: {
        doseAmount: 1,
        doseUnit: "tablet",
        frequency: "once_daily",
        timesOfDay: ["08:00"],
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        startDate: "2026-05-21",
        timezone: "Asia/Kolkata",
        instructions: "Take after breakfast"
      },
      reminders: { enabled: true, leadTimeMinutes: 15 },
      adherenceLogs: [],
      createdAt: "2026-05-20T18:32:39.184Z",
      updatedAt: "2026-05-20T18:32:39.184Z"
    };
    let capturedPatchBody: unknown;
    let capturedDeleteUrl = "";

    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

        if (url.includes("/auth/me")) {
          return Promise.resolve(createApiResponse({ user: authUser }));
        }

        if (url.includes("/health")) {
          return Promise.resolve(
            createApiResponse({
              status: "ok",
              service: "api",
              timestamp: new Date("2026-05-18T00:00:00.000Z").toISOString(),
              uptime: 42,
              dependencies: { mongo: "connected", redis: "connected" }
            })
          );
        }

        if (url.endsWith("/patient-profiles")) {
          return Promise.resolve(
            createApiResponse({
              profiles: [
                {
                  id: "profile-1",
                  ownerId: "user-1",
                  relationshipToOwner: "self",
                  fullName: "Javed Demo",
                  dateOfBirth: "2002-08-10T00:00:00.000Z",
                  sexAtBirth: "male",
                  bloodGroup: "O+",
                  heightCm: 175,
                  weightKg: 70,
                  allergies: [] as Array<{ name: string; severity: "mild" | "moderate" | "severe" | "unknown" }>,
                  chronicConditions: ["Asthma"],
                  emergencyContacts: [],
                  createdAt: "2026-05-20T18:32:39.184Z",
                  updatedAt: "2026-05-20T18:32:39.184Z"
                }
              ]
            })
          );
        }

        if (url.includes("/medications/medication-1") && init?.method === "PATCH") {
          capturedPatchBody = JSON.parse(String(init.body));
          medication = {
            ...medication,
            name: "Aspirin Low Dose",
            strength: "100mg",
            schedule: {
              ...medication.schedule,
              timesOfDay: ["09:00"],
              instructions: "Take after dinner"
            },
            updatedAt: "2026-05-21T10:00:00.000Z"
          };

          return Promise.resolve(createApiResponse({ medication }));
        }

        if (url.includes("/medications/medication-1") && init?.method === "DELETE") {
          capturedDeleteUrl = url;
          medication = undefined as unknown as typeof medication;

          return Promise.resolve(createApiResponse({ deleted: true }));
        }

        if (url.includes("/medications")) {
          return Promise.resolve(
            createApiResponse({
              medications: medication ? [medication] : [],
              pagination: { page: 1, limit: 50, total: medication ? 1 : 0, totalPages: medication ? 1 : 0 }
            })
          );
        }

        if (url.includes("/timeline-events")) {
          return Promise.resolve(
            createApiResponse({
              events: [],
              pagination: { page: 1, limit: 50, total: 0, totalPages: 0 }
            })
          );
        }

        return Promise.resolve(createApiResponse({}));
      })
    );

    renderApp();

    await screen.findByRole("heading", { name: "Overview" });
    expect(await screen.findByText("Aspirin")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Edit Aspirin" }));
    const nameInput = screen.getByLabelText("Medication name");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Aspirin Low Dose");

    const strengthInput = screen.getByLabelText("Strength");
    await userEvent.clear(strengthInput);
    await userEvent.type(strengthInput, "100mg");

    const timesInput = screen.getByLabelText("Times of day");
    await userEvent.clear(timesInput);
    await userEvent.type(timesInput, "09:00");

    const instructionsInput = screen.getByLabelText("Instructions");
    await userEvent.clear(instructionsInput);
    await userEvent.type(instructionsInput, "Take after dinner");
    await userEvent.click(screen.getByRole("button", { name: "Update medication" }));

    expect(await screen.findByText("Aspirin Low Dose")).toBeInTheDocument();
    expect(capturedPatchBody).toMatchObject({
      name: "Aspirin Low Dose",
      strength: "100mg",
      schedule: {
        timesOfDay: ["09:00"],
        instructions: "Take after dinner"
      }
    });

    await userEvent.click(screen.getByRole("button", { name: "Delete Aspirin Low Dose" }));

    expect(confirmSpy).toHaveBeenCalledWith(
      "Delete Aspirin Low Dose? This archives the medication and removes it from the active dashboard."
    );
    expect(capturedDeleteUrl).toContain("/patient-profiles/profile-1/medications/medication-1");
    expect(await screen.findByText("No medications found yet. Use Add medication to create one from the dashboard.")).toBeInTheDocument();
  });

  it("switches to the timeline workspace after authentication", async () => {
    stubAuthenticatedApi("degraded");

    renderApp();

    await screen.findByRole("heading", { name: "Overview" });
    await userEvent.click(screen.getByRole("button", { name: "Timeline" }));

    expect(screen.getByRole("heading", { name: "Timeline" })).toBeInTheDocument();
    expect(screen.getByText("Medical history, organized by time")).toBeInTheDocument();
    expect(screen.getByText("Demo timeline")).toBeInTheDocument();
    expect(screen.getAllByText("Annual checkup")).toHaveLength(2);
  });

  it("keeps dashboard section changes in browser history", async () => {
    window.history.replaceState(null, "", "/");
    stubAuthenticatedApi("degraded");

    renderApp();

    await screen.findByRole("heading", { name: "Overview" });
    await userEvent.click(screen.getByRole("button", { name: "Timeline" }));

    expect(window.location.hash).toBe("#timeline");
    expect(screen.getByRole("heading", { name: "Timeline" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Notifications" }));

    expect(window.location.hash).toBe("#notifications");
    expect(screen.getByRole("heading", { name: "Notifications" })).toBeInTheDocument();

    window.history.back();

    await waitFor(() => expect(window.location.hash).toBe("#timeline"));
    expect(screen.getByRole("heading", { name: "Timeline" })).toBeInTheDocument();
  });

  it("switches to the documents workspace and uses demo document records", async () => {
    stubAuthenticatedApi("degraded");

    renderApp();

    await screen.findByRole("heading", { name: "Overview" });
    await userEvent.click(screen.getByRole("button", { name: "Documents" }));

    expect(screen.getByRole("heading", { name: "Documents" })).toBeInTheDocument();
    expect(screen.getByText("Medical documents, organized securely")).toBeInTheDocument();
    expect(screen.getByText("Demo documents")).toBeInTheDocument();
    expect(screen.getByText("Upload is disabled in demo mode until an authenticated profile is available.")).toBeInTheDocument();
    expect(
      screen.getByText("Sharing is disabled in demo mode until a live authenticated document is selected.")
    ).toBeInTheDocument();
    expect(screen.getAllByText("CBC and lipid panel")).toHaveLength(2);
  });


  it("switches to the notifications workspace and displays live notifications", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

        if (url.includes("/auth/me")) {
          return Promise.resolve(createApiResponse({ user: authUser }));
        }

        if (url.includes("/health")) {
          return Promise.resolve(
            createApiResponse({
              status: "ok",
              service: "api",
              timestamp: new Date("2026-05-18T00:00:00.000Z").toISOString(),
              uptime: 42,
              dependencies: { mongo: "connected", redis: "connected" }
            })
          );
        }

        if (url.endsWith("/patient-profiles")) {
          return Promise.resolve(createApiResponse({ profiles: [] }));
        }

        if (url.includes("/notifications/notification-1/read") && init?.method === "PATCH") {
          return Promise.resolve(
            createApiResponse({
              notification: {
                id: "notification-1",
                ownerId: "user-1",
                type: "system",
                channels: ["in_app"],
                title: "Website notification test",
                message: "This notification was created from the backend and stored in MongoDB.",
                status: "read",
                readAt: "2026-05-25T05:30:00.000Z",
                metadata: { source: "manual-terminal-test" },
                createdAt: "2026-05-25T05:00:00.000Z",
                updatedAt: "2026-05-25T05:30:00.000Z"
              }
            })
          );
        }

        if (url.includes("/notifications")) {
          return Promise.resolve(
            createApiResponse({
              notifications: [
                {
                  id: "notification-1",
                  ownerId: "user-1",
                  type: "system",
                  channels: ["in_app"],
                  title: "Website notification test",
                  message: "This notification was created from the backend and stored in MongoDB.",
                  status: "sent",
                  metadata: { source: "manual-terminal-test" },
                  createdAt: "2026-05-25T05:00:00.000Z",
                  updatedAt: "2026-05-25T05:00:00.000Z"
                }
              ],
              pagination: { page: 1, limit: 50, total: 1, totalPages: 1 }
            })
          );
        }

        return Promise.resolve(
          createApiResponse({
            events: [],
            medications: [],
            pagination: { page: 1, limit: 50, total: 0, totalPages: 0 }
          })
        );
      })
    );

    renderApp();

    await screen.findByRole("heading", { name: "Overview" });
    await userEvent.click(screen.getByRole("button", { name: "Notifications" }));

    expect(screen.getByRole("heading", { name: "Notifications" })).toBeInTheDocument();
    expect(await screen.findByText("Live alerts from your MedVault backend")).toBeInTheDocument();
    expect(await screen.findByText("Website notification test")).toBeInTheDocument();
    expect(screen.getByText("This notification was created from the backend and stored in MongoDB.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Mark read" }));

    expect(await screen.findByText("Website notification test")).toBeInTheDocument();
  });
  it("switches to the security workspace and shows consent management", async () => {
    stubAuthenticatedApi("degraded");

    renderApp();

    await screen.findByRole("heading", { name: "Overview" });
    await userEvent.click(screen.getByRole("button", { name: "Security" }));

    expect(screen.getByRole("heading", { name: "Security" })).toBeInTheDocument();
    expect(screen.getByText("Patient-controlled access consent")).toBeInTheDocument();
    expect(
      screen.getByText("Consent creation is disabled in demo mode until an authenticated profile is available.")
    ).toBeInTheDocument();
    expect(screen.getByText("Dr. Meera Sharma")).toBeInTheDocument();
  });
});






