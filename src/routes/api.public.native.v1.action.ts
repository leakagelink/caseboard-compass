import { createFileRoute } from '@tanstack/react-router';
import { nativeHandler } from '@/lib/native-http';

export const Route = createFileRoute('/api/public/native/v1/action')({
  server: { handlers: {
    POST: async ({ request }) => nativeHandler(request, 'action', {
      url: process.env['SUPABASE_URL'], key: process.env['SUPABASE_PUBLISHABLE_KEY'],
    }),
  } },
});
