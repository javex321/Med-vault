import type { TimelineEvent, TimelineEventFhirResource } from "@medvault/shared";

import type { TimelineEventDocument } from "./timeline-event.model.js";

function optionalString(value: string | null | undefined) {
  return value ?? undefined;
}

function optionalDate(value: Date | null | undefined) {
  return value ? value.toISOString() : undefined;
}

function mapFhirResource(
  resource: TimelineEventDocument["fhirResource"]
): TimelineEventFhirResource | undefined {
  if (!resource) return undefined;

  return {
    resourceType: resource.resourceType,
    resourceId: optionalString(resource.resourceId),
    coding: resource.coding.map((coding) => ({
      system: optionalString(coding.system),
      code: coding.code,
      display: optionalString(coding.display)
    }))
  };
}

export function toTimelineEvent(event: TimelineEventDocument): TimelineEvent {
  return {
    id: event._id.toString(),
    ownerId: event.ownerId.toString(),
    profileId: event.profileId.toString(),
    type: event.type,
    title: event.title,
    occurredAt: event.occurredAt.toISOString(),
    endedAt: optionalDate(event.endedAt),
    providerName: optionalString(event.providerName),
    facilityName: optionalString(event.facilityName),
    summary: optionalString(event.summary),
    tags: [...event.tags],
    source: event.source,
    sensitivity: event.sensitivity,
    fhirResource: mapFhirResource(event.fhirResource),
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString()
  };
}
