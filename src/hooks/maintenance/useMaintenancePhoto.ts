import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'maintenance-photos';

/** Upload een foto naar de private bucket en geef het opgeslagen pad terug. */
export async function uploadMaintenancePhoto(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || 'image/jpeg',
    upsert: false,
  });
  if (error) throw error;
  return path;
}

/** Genereert een signed URL voor een opgeslagen pad. */
export function useSignedPhotoUrl(path: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!path) {
      setUrl(null);
      return;
    }
    let cancelled = false;
    supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, 60 * 60)
      .then(({ data }) => {
        if (!cancelled) setUrl(data?.signedUrl ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return url;
}
