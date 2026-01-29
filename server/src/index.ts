// Import necessary modules from the Express framework and standard Node.js libraries.
import express, { Express, Request, Response } from 'express';
import multer, { Multer } from 'multer';
import path from 'path';
import cors from 'cors';
import fs from 'fs';
import { supabase } from './supabaseClient';

// --- Configuration ---

// Define the port the server will run on. Use an environment variable or default to 3001.
const PORT = process.env.PORT || 3001;

// --- Express App Initialization ---

// Create an instance of the Express application.
const app: Express = express();

// --- Middleware ---

// Enable Cross-Origin Resource Sharing (CORS) for all routes.
// This is crucial for allowing the React frontend (running on a different port)
// to communicate with this backend.
app.use(cors());

// --- File Upload Handling (Multer) ---

// Configure multer to use memory storage.
// This is because we are going to upload the file to Supabase directly,
// so we don't need to save it to the disk first.
const storage = multer.memoryStorage();
const upload: Multer = multer({ storage });

// --- API Routes ---

/**
 * @route   GET /files
 * @desc    Get a list of all uploaded files from Supabase.
 * @access  Public
 */
app.get('/files', async (req: Request, res: Response) => {
  console.log('GET /files: Retrieving file list from Supabase.');
  
  // Assumes you have a table named 'files' with columns 'id', 'name', and 'url'.
  const { data, error } = await supabase.from('files').select('*');

  if (error) {
    console.error('Error fetching files from Supabase:', error);
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

/**
 * @route   POST /upload
 * @desc    Upload a new image file to Supabase.
 * @access  Public
 */
app.post('/upload', upload.single('image'), async (req: Request, res: Response) => {
  if (!req.file) {
    console.error('POST /upload: No file provided.');
    return res.status(400).send('No file uploaded.');
  }

  const file = req.file;
  const fileName = `${Date.now()}-${file.originalname}`;

  console.log(`POST /upload: Received file "${file.originalname}". Uploading to Supabase as "${fileName}".`);

  // Assumes you have a Supabase Storage bucket named 'textures'.
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('textures') // Changed from 'images' to 'textures'
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      cacheControl: '3600',
    });

  if (uploadError) {
    console.error('Error uploading file to Supabase Storage:', uploadError);
    return res.status(500).json({ error: uploadError.message });
  }

  // Get the public URL of the uploaded file
  const { data: publicUrlData } = supabase.storage
    .from('textures') // Changed from 'images' to 'textures'
    .getPublicUrl(fileName);

  if (!publicUrlData) {
      return res.status(500).json({ error: 'Could not get public URL for the uploaded file.' });
  }
  const fileUrl = publicUrlData.publicUrl;


  // Save the file metadata to the 'files' table.
  const { data: dbData, error: dbError } = await supabase
    .from('files')
    .insert([{ name: file.originalname, url: fileUrl }])
    .select();

  if (dbError) {
    console.error('Error saving file metadata to Supabase DB:', dbError);
    return res.status(500).json({ error: dbError.message });
  }

  res.status(201).json(dbData[0]);
});

// --- Server Startup ---

// Start the Express server and listen for incoming requests on the specified port.
app.listen(PORT, () => {
  console.log(`
    ================================================
    🚀 TypeScript Express server is running!
    ✅ Listening on port: ${PORT}
    🌐 Frontend should connect to this address.
    ================================================
  `);
});

// --- Middleware ---

// Enable Cross-Origin Resource Sharing (CORS) for all routes.
// This is crucial for allowing the React frontend (running on a different port)
// to communicate with this backend.
app.use(cors());

// --- File Upload Handling (Multer) ---

// Configure multer to use memory storage.
// This is because we are going to upload the file to Supabase directly,
// so we don't need to save it to the disk first.
const storage = multer.memoryStorage();
const upload: Multer = multer({ storage });

// --- API Routes ---

/**
 * @route   GET /files
 * @desc    Get a list of all uploaded files from Supabase.
 * @access  Public
 */
app.get('/files', async (req: Request, res: Response) => {
  console.log('GET /files: Retrieving file list from Supabase.');
  
  // Assumes you have a table named 'files' with columns 'id', 'name', and 'url'.
  const { data, error } = await supabase.from('files').select('*');

  if (error) {
    console.error('Error fetching files from Supabase:', error);
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

/**
 * @route   POST /upload
 * @desc    Upload a new image file to Supabase.
 * @access  Public
 */
app.post('/upload', upload.single('image'), async (req: Request, res: Response) => {
  if (!req.file) {
    console.error('POST /upload: No file provided.');
    return res.status(400).send('No file uploaded.');
  }

  const file = req.file;
  const fileName = `${Date.now()}-${file.originalname}`;

  console.log(`POST /upload: Received file "${file.originalname}". Uploading to Supabase as "${fileName}".`);

  // Assumes you have a Supabase Storage bucket named 'images'.
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('images')
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      cacheControl: '3600',
    });

  if (uploadError) {
    console.error('Error uploading file to Supabase Storage:', uploadError);
    return res.status(500).json({ error: uploadError.message });
  }

  // Get the public URL of the uploaded file
  const { data: publicUrlData } = supabase.storage
    .from('images')
    .getPublicUrl(fileName);

  if (!publicUrlData) {
      return res.status(500).json({ error: 'Could not get public URL for the uploaded file.' });
  }
  const fileUrl = publicUrlData.publicUrl;


  // Save the file metadata to the 'files' table.
  const { data: dbData, error: dbError } = await supabase
    .from('files')
    .insert([{ name: file.originalname, url: fileUrl }])
    .select();

  if (dbError) {
    console.error('Error saving file metadata to Supabase DB:', dbError);
    return res.status(500).json({ error: dbError.message });
  }

  res.status(201).json(dbData[0]);
});

// --- Server Startup ---

// Start the Express server and listen for incoming requests on the specified port.
app.listen(PORT, () => {
  console.log(`
    ================================================
    🚀 TypeScript Express server is running!
    ✅ Listening on port: ${PORT}
    🌐 Frontend should connect to this address.
    ================================================
  `);
});
