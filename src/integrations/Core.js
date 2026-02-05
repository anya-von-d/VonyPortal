import { supabase } from '@/lib/supabaseClient';

const bucketName = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'public';

const getFilePath = (file, userId) => {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  return `${userId || 'anonymous'}/${timestamp}-${safeName}`;
};

export const UploadFile = async ({ file, userId }) => {
  if (!file) {
    throw new Error('No file provided');
  }

  const filePath = getFilePath(file, userId);
  const { error } = await supabase.storage.from(bucketName).upload(filePath, file, {
    upsert: true
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
  return { file_url: data?.publicUrl };
};
