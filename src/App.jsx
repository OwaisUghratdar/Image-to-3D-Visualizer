import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useTexture, Center, Environment } from '@react-three/drei';
import FilesModal from './FilesModal';

// Define the server's base URL for easy modification.
const API_URL = 'http://localhost:3001';

// This component handles the 3D logic
function CardboardBox({ textureUrl }) {
  // If no image is uploaded, it just shows a cardboard-brown color
  const texture = textureUrl ? useTexture(textureUrl) : null;

  return (
    <Center top>
      <mesh castShadow>
        <boxGeometry args={[3, 3, 3]} />
        <meshStandardMaterial
          map={texture}
          color={texture ? "white" : "#b88a44"}
          roughness={0.7}
        />
      </mesh>
    </Center>
  );
}

export default function App() {
  const [image, setImage] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);

  // Handler for the main file upload input.
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // --- Optimistic Update ---
    // 1. Create a local URL for the file. This is very fast.
    const localUrl = URL.createObjectURL(file);
    // 2. Immediately apply the texture to the box for a snappy user experience.
    setImage(localUrl);
    // Note: This local URL is temporary and will be revoked by the browser later.

    // --- Backend Upload (in the background) ---
    // 3. Prepare the file for upload.
    const formData = new FormData();
    formData.append('image', file);

    // 4. Send the file to the server without waiting for the response to update the UI.
    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("File upload to server failed.");
      }

      const savedFile = await response.json();
      // Log success and setImage
      console.log("File successfully saved to server:", savedFile);
      setImage(savedFile.url);

    } catch (err) {
      // The user-facing texture is already set, so we just log the error.
      console.error("Failed to upload file:", err);
      alert(
        "FYI: The image was applied to the box, but we could not save it to the server. It will be gone on refresh."
      );
    }
  };

  // This function is passed to the modal to handle when a user clicks "Use"
  const handleFileSelectFromModal = (url) => {
    setImage(url);
    setModalOpen(false); // Close modal after selection
  };

  return (
    // The main container for the whole application, filling the viewport and setting a dark background.
    <div style={{ width: '100vw', height: '100vh', background: '#1a1a1a' }}>
      {/* UI Overlay */}
      {/* This div acts as a 2D overlay on top of the 3D scene, providing user interaction elements. */}
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 1, color: 'white', fontFamily: 'sans-serif' }}>
        <h2 style={{ margin: 0 }}>Box Prototyper</h2>
        <p>Upload a PNG to skin the box</p>
        <input type="file" accept="image/png" onChange={handleUpload} />
        <button
          style={{ background: '#555', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}
          onClick={() => setModalOpen(true)}
        >
          More Files...
        </button>
      </div>

      <FilesModal
        show={isModalOpen}
        onClose={() => setModalOpen(false)}
        onFileSelect={handleFileSelectFromModal}
        setImage={setImage} // Pass down the setImage function
      />

      {/* 3D Scene */}
      {/* The Canvas component from @react-three/fiber sets up the 3D rendering environment. */}
      {/* It handles the scene, camera, and renderer for all 3D objects. */}
      <Canvas shadows camera={{ position: [5, 5, 5], fov: 45 }}>
        {/* ambientLight provides a general, non-directional light to the entire scene. */}
        <ambientLight intensity={0.5} />
        {/* pointLight simulates a light source at a specific point, casting shadows. */}
        <pointLight position={[10, 10, 10]} castShadow />
        {/* Environment adds realistic lighting and reflections based on a preset HDRI. */}
        <Environment preset="city" />

        {/* The CardboardBox component renders the 3D box, receiving the uploaded image URL as a prop. */}
        <CardboardBox textureUrl={image} />

        {/* OrbitControls allows the user to interactively rotate, pan, and zoom the camera. */}
        <OrbitControls minPolarAngle={0} maxPolarAngle={Math.PI / 2.1} />
        {/* gridHelper displays a grid on the ground, aiding in spatial perception. */}
        <gridHelper args={[10, 10]} />
      </Canvas>
    </div>
  );
}