import React, { useState, useEffect, useCallback } from 'react';

// Define the server's base URL for easy modification.
const API_URL = 'http://localhost:3001';

// Styles for the modal (unchanged)
const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 100,
};

const modalContentStyle = {
  background: '#2a2a2a',
  padding: '20px',
  borderRadius: '8px',
  color: 'white',
  fontFamily: 'sans-serif',
  width: '400px',
  maxHeight: '80vh',
  overflowY: 'auto',
  position: 'relative',
};

const fileListItemStyle = {
  background: '#3a3a3a',
  padding: '10px',
  borderRadius: '4px',
  marginBottom: '10px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const buttonStyle = {
  background: '#555',
  color: 'white',
  border: 'none',
  padding: '10px 15px',
  borderRadius: '4px',
  cursor: 'pointer',
  margin: '5px'
};

export default function FilesModal({ show, onClose, onFileSelect, setImage }) {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Create a reusable function to fetch files from the server.
  // useCallback ensures this function isn't recreated on every render.
  const fetchFiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/files`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setFiles(data);
    } catch (err) {
      console.error("Failed to fetch files:", err);
      setError('Could not load files. Is the server running?');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Effect to fetch files when the modal becomes visible.
  useEffect(() => {
    if (show) {
      fetchFiles();
    }
  }, [show, fetchFiles]);

  // Handler for the file upload input inside the modal.
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // --- Optimistic Update ---
      // 1. Create a local URL for the file.
      const localUrl = URL.createObjectURL(file);
      // 2. Immediately apply the texture to the box for a snappy user experience.
      //    This requires the setImage function to be passed down from App.jsx.
      if (setImage) {
        setImage(localUrl);
      }
      
      // --- Backend Upload (in the background) ---
      const formData = new FormData();
      formData.append('image', file);

      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('File upload failed.');
        }

        // After a successful upload, refresh the file list to show the new file.
        // We do this after the server response, so the URL in the list is the server-provided one.
        await fetchFiles();
      } catch (err) {
        console.error("Failed to upload file:", err);
        setError('File upload failed. Please try again.');
        // Notify the user if the server upload failed, but the local preview remains.
        alert('FYI: The image was applied to the box, but could not be saved to the server.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
        <h2 style={{marginTop: 0}}>Uploaded Files</h2>
        <button style={{...buttonStyle, position: 'absolute', top: '20px', right: '20px'}} onClick={onClose}>Close</button>
        
        <div style={{ margin: '20px 0' }}>
          <label htmlFor="modal-upload" style={{...buttonStyle, display: 'inline-block'}}>Upload New File</label>
          <input id="modal-upload" type="file" accept="image/png" onChange={handleUpload} style={{ display: 'none' }} />
        </div>

        <div>
          {isLoading && <p>Loading...</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {!isLoading && !error && files.length === 0 && <p>No files uploaded yet.</p>}
          {files.map(file => (
            <div key={file.id} style={fileListItemStyle}>
              <span>{file.name}</span>
              <button style={buttonStyle} onClick={() => onFileSelect(file.url)}>Use</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
