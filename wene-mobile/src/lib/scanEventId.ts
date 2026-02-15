import { parseEventId } from './eventId';

function normalizeCandidate(candidate: string | null | undefined): string | null {
  if (!candidate) return null;
  let decoded = candidate.replace(/\+/g, ' ');
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // percent-encoding が壊れている場合は生値を使う
  }
  const parsed = parseEventId(decoded);
  return parsed.valid ? parsed.eventId : null;
}

function extractFromQuery(raw: string): string | null {
  const match = raw.match(/(?:[?&]|^)eventId=([^&#]+)/i);
  if (!match || !match[1]) return null;
  return normalizeCandidate(match[1]);
}

function looksLikeEventId(raw: string): boolean {
  return !/[/?&#:=]/.test(raw);
}

export function extractEventIdFromQrPayload(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const fromQuery = extractFromQuery(trimmed);
  if (fromQuery) return fromQuery;

  if (looksLikeEventId(trimmed)) {
    return normalizeCandidate(trimmed);
  }

  return null;
}
