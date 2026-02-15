import React, { useState, useEffect, useCallback } from 'react';

const API_URL = 'http://localhost:3001';

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
      console.error('Failed to fetch files:', err);
      setError('Could not load files. Is the server running?');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (show) {
      fetchFiles();
    }
  }, [show, fetchFiles]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    if (setImage) {
      setImage(localUrl);
    }

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

      const savedFile = await response.json();
      if (setImage && savedFile?.url) {
        setImage(savedFile.url);
        URL.revokeObjectURL(localUrl);
      }

      await fetchFiles();
    } catch (err) {
      console.error('Failed to upload file:', err);
      setError('File upload failed. Please try again.');
      alert('FYI: The image was applied to the box, but could not be saved to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginTop: 0 }}>Uploaded Files</h2>
        <button style={{ ...buttonStyle, position: 'absolute', top: '20px', right: '20px' }} onClick={onClose}>Close</button>

        <div style={{ margin: '20px 0' }}>
          <label htmlFor="modal-upload" style={{ ...buttonStyle, display: 'inline-block' }}>Upload New File</label>
          <input id="modal-upload" type="file" accept="image/png" onChange={handleUpload} style={{ display: 'none' }} />
        </div>

        <div>
          {isLoading && <p>Loading...</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {!isLoading && !error && files.length === 0 && <p>No files uploaded yet.</p>}
          {files.map((file) => (
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
