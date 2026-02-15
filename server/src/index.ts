import express, { Express, Request, Response } from 'express';
import multer, { Multer } from 'multer';
import cors from 'cors';
import { supabase } from './supabaseClient';

const PORT = process.env.PORT || 3001;
const STORAGE_BUCKET = 'textures';
const MAX_STORED_FILES = 10;

const app: Express = express();

app.use(cors());

const storage = multer.memoryStorage();
const upload: Multer = multer({ storage });

function getStoragePathFromPublicUrl(url: string) {
  try {
    const parsed = new URL(url);
    const marker = `/object/public/${STORAGE_BUCKET}/`;
    const markerIndex = parsed.pathname.indexOf(marker);

    if (markerIndex === -1) {
      return null;
    }

    const objectPath = parsed.pathname.slice(markerIndex + marker.length);
    return objectPath ? decodeURIComponent(objectPath) : null;
  } catch {
    return null;
  }
}

async function enforceMaxStoredFiles() {
  const { data: files, error } = await supabase
    .from('textures')
    .select('id,url,created_at')
    .order('created_at', { ascending: true });

  if (error || !files || files.length <= MAX_STORED_FILES) {
    return;
  }

  const filesToRemove = files.slice(0, files.length - MAX_STORED_FILES);
  const idsToRemove = filesToRemove.map((file) => file.id);
  const storagePathsToRemove = filesToRemove
    .map((file) => getStoragePathFromPublicUrl(file.url))
    .filter((path): path is string => Boolean(path));

  if (idsToRemove.length > 0) {
    const { error: deleteRowsError } = await supabase
      .from('textures')
      .delete()
      .in('id', idsToRemove);

    if (deleteRowsError) {
      console.error('Failed deleting old file rows:', deleteRowsError);
    }
  }

  if (storagePathsToRemove.length > 0) {
    const { error: deleteStorageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove(storagePathsToRemove);

    if (deleteStorageError) {
      console.error('Failed deleting old storage objects:', deleteStorageError);
    }
  }
}

app.get('/files', async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('textures')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching files from Supabase:', error);
    return res.status(500).json({ error: error.message });
  }

  return res.json(data);
});

app.post('/upload', upload.single('image'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const file = req.file;

  if (!file.mimetype.startsWith('image/')) {
    return res.status(400).json({ error: 'Only image uploads are supported.' });
  }

  const fileName = `${Date.now()}-${file.originalname}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Error uploading file to Supabase Storage:', uploadError);
    return res.status(500).json({ error: uploadError.message });
  }

  const { data: publicUrlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(fileName);

  const fileUrl = publicUrlData?.publicUrl;
  if (!fileUrl) {
    return res.status(500).json({ error: 'Could not get public URL for uploaded file.' });
  }

  const { data: dbData, error: dbError } = await supabase
    .from('textures')
    .insert([{ name: file.originalname, url: fileUrl }])
    .select()
    .single();

  if (dbError) {
    console.error('Error saving file metadata to Supabase DB:', dbError);
    await supabase.storage.from(STORAGE_BUCKET).remove([fileName]);
    return res.status(500).json({ error: dbError.message });
  }

  await enforceMaxStoredFiles();

  return res.status(201).json(dbData);
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
