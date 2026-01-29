# 3D Image Visualizer - Overview

This app allows users to visualize an image on a 3D object using Three.js

## Key Features: Dynamic 3D Texture Visualization

The core feature of the "Second Me" / "Magentic-UI" project is the **dynamic visualization of user-uploaded images as textures on a 3D object within an interactive 3D environment**.

Here's a breakdown:

*   **Interactive 3D Display:** The application presents a 3D object (e.g., a simple box or a more complex model) rendered in a 3D space, powered by a React frontend using the `@react-three/fiber` library. This creates a visually engaging and interactive experience.

*   **Image as Texture:** Users can upload their own image files (e.g., PNGs). Upon upload, these images are not just stored; they are immediately applied as a **texture** onto the visible 3D object in real-time. This transforms the appearance of the 3D object based on the user's input.

*   **Persistent Storage with Supabase:**
    *   The uploaded images are securely saved to a dedicated `textures` bucket in **Supabase Storage**.
    *   Crucially, metadata about these images (like their name and URL) is stored in a **Supabase database**. This creates a library of all previously uploaded textures.

*   **Dynamic Texture Switching:** A key functionality allows users to easily **switch between any of their previously uploaded and saved textures**. By selecting an image from their personal library (fetched from the Supabase database), the 3D object's appearance instantly updates, showcasing the chosen texture. This provides a dynamic way to experiment with different visual styles on the 3D model.

In essence, the project enables a seamless workflow: **Upload an image -> See it instantly on a 3D object -> Save it -> Recall and re-apply it anytime.** This creates a highly personalized and interactive visual experience.

## Tech Stack

*   **Frontend:** React, Vite, `@react-three/fiber`
*   **Backend:** Node.js, Express, Multer
*   **Database/Storage:** Supabase (PostgreSQL, Supabase Storage)

## Setup and Local Development

To get this project running on your local machine, follow these steps:

1.  **Clone the Repository:**
    ```bash
    git clone <YOUR_REPOSITORY_URL>
    cd <YOUR_PROJECT_DIRECTORY>
    ```

2.  **Supabase Configuration:**
    *   **Create a Supabase Project:** If you don't have one, create a new project on [Supabase](https://supabase.com/).
    *   **Environment Variables:** In the `server` directory, create a `.env` file with your Supabase credentials:
        ```
        SUPABASE_URL="YOUR_SUPABASE_URL"
        SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
        ```
        You can find these in your Supabase project settings (`Project Settings -> API`).
    *   **Create Storage Bucket:** Create a new storage bucket named `textures` in your Supabase project. This is where uploaded images will be stored.
    *   **Create Database Table:** Create a database table named `files` in your Supabase project with the following schema:
        ```sql
        CREATE TABLE files (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          url TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        ```

3.  **Backend Setup (Node.js):**
    *   Navigate to the `server` directory:
        ```bash
        cd server
        ```
    *   Install dependencies:
        ```bash
        npm install
        ```
    *   Start the backend server:
        ```bash
        npm start
        ```
        The server will run on `http://localhost:3001`.

4.  **Frontend Setup (React):**
    *   Navigate back to the project root and then into the frontend `src` directory (if separate) or just the root if it's a monorepo structure:
        ```bash
        cd .. # If you are in the server directory
        npm install
        ```
    *   Start the React development server:
        ```bash
        npm run dev
        ```
        The frontend will typically run on `http://localhost:5173` (or another port).

Your application should now be running locally, with the frontend communicating with the backend and Supabase.