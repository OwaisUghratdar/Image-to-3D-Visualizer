import React, { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useTexture, Center, Environment } from '@react-three/drei';
import FilesModal from './FilesModal';

const API_URL = 'http://localhost:3001';
function TexturedMaterial({ textureUrl }) {
  const texture = useTexture(textureUrl);

  return <meshStandardMaterial map={texture} color="white" roughness={0.7} />;
}

function CardboardBox({ textureUrl }) {
  return (
    <Center top>
      <mesh castShadow>
        <boxGeometry args={[3, 3, 3]} />
        {textureUrl ? (
          <TexturedMaterial textureUrl={textureUrl} />
        ) : (
          <meshStandardMaterial color="#b88a44" roughness={0.7} />
        )}
      </mesh>
    </Center>
  );
}

export default function App() {
  const [image, setImage] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const previousImageRef = useRef(null);

  useEffect(() => {
    const previousImage = previousImageRef.current;
    if (previousImage && previousImage.startsWith('blob:') && previousImage !== image) {
      URL.revokeObjectURL(previousImage);
    }

    previousImageRef.current = image;
  }, [image]);

  useEffect(() => {
    return () => {
      const previousImage = previousImageRef.current;
      if (previousImage && previousImage.startsWith('blob:')) {
        URL.revokeObjectURL(previousImage);
      }
    };
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setImage(localUrl);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('File upload to server failed.');
      }

      const savedFile = await response.json();
      if (savedFile?.url) {
        setImage(savedFile.url);
      }
    } catch (err) {
      console.error('Failed to upload file:', err);
      alert(
        'FYI: The image was applied to the box, but we could not save it to the server. It will be gone on refresh.'
      );
    }
  };

  const handleFileSelectFromModal = (url) => {
    setImage(url);
    setModalOpen(false);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1a1a' }}>
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
        setImage={setImage}
      />

      <Canvas shadows camera={{ position: [5, 5, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} castShadow />
        <Environment preset="city" />

        <CardboardBox textureUrl={image} />

        <OrbitControls minPolarAngle={0} maxPolarAngle={Math.PI / 2.1} />
        <gridHelper args={[10, 10]} />
      </Canvas>
    </div>
  );
}
