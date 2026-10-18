import { createServerOnlyFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { Database } from '@/integrations/supabase/types';
import { actionSchema, areaSchema, nativeEnvelope } from './game-input';
import { readGame, mutateGame } from './game-service';
import { GameFault, nativeProgress } from './native-protocol';

export type NativeOperation = 'progress' | 'area' | 'action' | 'session';
export const nativeHandler = createServerOnlyFn(async (request: Request, operation: NativeOperation, config: { url: string | undefined; key: string | undefined }) => {
  const headers = { 'Cache-Control': 'private, no-store', 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff' };
  try {
    const token = request.headers.get('Authorization')?.match(/^Bearer (\S+)$/i)?.[1];
    if (!token || token.length > 8192 || token.split('.').length !== 3) throw new GameFault('UNAUTHORIZED', 401, 'Sign in with a valid player session.');
    if (!config.url || !config.key) throw new GameFault('UNAVAILABLE', 503, 'Player service is unavailable.');
    const key = config.key;
    const supabase = createClient<Database>(config.url, key, {
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
      global: { headers: { Authorization: `Bearer ${token}` }, fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith('sb_') && h.get('Authorization') === `Bearer ${key}`) h.delete('Authorization');
        h.set('apikey', key); return fetch(input, { ...init, headers: h });
      } },
    });
    const verified = await supabase.auth.getUser(token);
    if (verified.error || !verified.data.user) throw new GameFault('UNAUTHORIZED', 401, 'Your player session expired. Sign in again.');
    const context = { supabase, userId: verified.data.user.id };
    if (operation === 'progress') {
      const game = await readGame(context);
      return Response.json(nativeProgress(game.state, game.revision, game.cases), { headers });
    }
    if (!request.headers.get('Content-Type')?.includes('application/json')) throw new GameFault('INVALID_REQUEST', 415, 'Send a JSON request.');
    // Stream limit works even when Content-Length is missing or untrusted.
    const reader = request.body?.getReader();
    if (!reader) throw new GameFault('INVALID_REQUEST', 400, 'Missing request body.');
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) {
      const chunk = await reader.read(); if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > 8192) { await reader.cancel(); throw new GameFault('INVALID_REQUEST', 413, 'Request is too large.'); }
      chunks.push(chunk.value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    let input: unknown;
    try { input = JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new GameFault('INVALID_REQUEST', 400, 'Invalid JSON.'); }
    const schema = operation === 'area' ? nativeEnvelope.extend({ area: areaSchema.shape.area }).strict() : nativeEnvelope.extend({ action: actionSchema }).strict();
    const data = schema.parse(input);
    if ('action' in data && operation === 'session' && data.action.kind !== 'pause' && data.action.kind !== 'resume') throw new GameFault('INVALID_REQUEST', 400, 'Session accepts only pause or resume.');
    if ('action' in data && operation === 'action' && (data.action.kind === 'pause' || data.action.kind === 'resume')) throw new GameFault('INVALID_REQUEST', 400, 'Use the session endpoint to pause or resume.');
    const command = 'area' in data ? { type: 'area' as const, area: data.area } : { type: 'action' as const, action: data.action };
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify({ version: 1, owner: context.userId, operation, revision: data.expectedRevision, command })));
    const fingerprint = Array.from(new Uint8Array(digest), x => x.toString(16).padStart(2, '0')).join('');
    const game = await mutateGame(context, command, { expectedRevision: data.expectedRevision, requestId: data.requestId, fingerprint });
    return Response.json({ ...nativeProgress(game.state, game.revision, game.cases), replayed: game.replayed, appliedRevision: game.appliedRevision, ...(game.message ? { message: game.message } : {}) }, { headers });
  } catch (error) {
    const fault = error instanceof GameFault ? error : error instanceof z.ZodError ? new GameFault('INVALID_REQUEST', 400, 'Invalid request fields.') : new GameFault('UNAVAILABLE', 503, 'Player service is temporarily unavailable.');
    return Response.json({ error: { code: fault.code, message: fault.message } }, { status: fault.status, headers: { ...headers, ...(fault.status === 401 ? { 'WWW-Authenticate': 'Bearer' } : {}), ...(fault.status === 429 ? { 'Retry-After': '60' } : {}) } });
  }
});