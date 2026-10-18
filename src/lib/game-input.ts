import { z } from 'zod';

const base = { caseId: z.string().min(1).max(96) };
export const actionSchema = z.discriminatedUnion('kind', [
  z.object({ ...base, kind: z.literal('inspect'), clueId: z.string().min(1).max(120) }).strict(),
  z.object({ ...base, kind: z.literal('judge'), clueId: z.string().min(1).max(120), verdict: z.enum(['relevant', 'misleading']) }).strict(),
  z.object({ ...base, kind: z.literal('accuse'), suspectId: z.string().min(1).max(120) }).strict(),
  ...(['hint', 'start', 'tick', 'scan', 'strike', 'dodge', 'pause', 'resume'] as const).map(kind => z.object({ ...base, kind: z.literal(kind) }).strict()),
]);
export const areaSchema = z.object({ area: z.string().regex(/^-?\d{1,5}:-?\d{1,5}$/).transform(value => {
  const [lat, lng] = value.split(':').map(Number);
  if (lat === undefined || lng === undefined || lat < -9000 || lat > 9000 || lng < -18000 || lng > 18000) throw new Error('Invalid area.');
  return `${lat}:${lng}`;
}) }).strict();
export const nativeEnvelope = z.object({ expectedRevision: z.number().int().min(0).max(2147483646), requestId: z.string().uuid() }).strict();