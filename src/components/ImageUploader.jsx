import React, { useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import { confirmAlert } from 'react-confirm-alert';
import 'react-toastify/dist/ReactToastify.css';
import 'react-confirm-alert/src/react-confirm-alert.css';
import Compressor from 'compressorjs';
import './ImageUploader.css';

const ImageUploader = () => {
  const [responses, setResponses] = useState([]);
  const [errors, setErrors] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const MAX_WIDTH = 3000; // Maximum allowed width: 3000px
  const MAX_HEIGHT = 2000; // Maximum allowed height: 2000px

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
    handleFiles(selectedFiles);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    handleFiles(droppedFiles);
  };

  const handleFiles = async (selectedFiles) => {
    setFiles([]); // Clear previous files
    const compressedFiles = [];
    const excludedFiles = [];

    const compressFile = (file) => new Promise((resolve, reject) => {
      new Compressor(file, {
        quality: 0.6, // Adjust the quality as needed (0.6 = 60% quality)
        success: resolve,
        error: reject
      });
    });

    const getImageDimensions = (file) => new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
    });

    try {
      for (const file of selectedFiles) {
        const { width, height } = await getImageDimensions(file);
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          excludedFiles.push(file.name);
          continue;
        }

        const compressedFile = await compressFile(file);
        compressedFiles.push(compressedFile);
      }

      if (excludedFiles.length > 0) {
        toast.error(`The following files were not uploaded due to high resolution: ${excludedFiles.join(', ')}.`, { autoClose: 10000 });
      }

      setFiles(compressedFiles);
    } catch (error) {
      toast.error(`Compression error: ${error.message}`, { autoClose: 10000 });
    }
  };

  const handleApiError = (error) => {
    const errorMessage = error.response?.data?.error || error.message;
    console.error('API Error:', errorMessage);
    return errorMessage;
  };

  const uploadFiles = async () => {
    setErrors([]);
    setResponses([]);
    setLoading(true);

    if (files.length === 0) {
      const errorMessage = 'Please select files to upload.';
      setErrors([errorMessage]);
      setLoading(false);
      toast.error(errorMessage, { autoClose: 10000 });
      return;
    }

    try {
      const res = await axios.post('http://localhost:5173/pipeline/assets/stage', { count: files.length });
      console.log('Stage Response:', res.data);

      if (!res.data || !res.data.responses) {
        throw new Error('Invalid response format from the server');
      }

      const { responses: urlResponses } = res.data;

      if (!Array.isArray(urlResponses)) {
        throw new Error('urlResponses is not an array');
      }

      const uploadPromises = files.map((file, index) => {
        const { url, key } = urlResponses[index];
        return axios.put(url, file, {
          headers: {
            'Content-Type': file.type,
          }
        }).then(() => {
          return { status: 'uploaded', key, fileName: file.name };
        }).catch((error) => {
          const errorMessage = handleApiError(error);
          return { status: 'error', key, fileName: file.name, error: errorMessage };
        });
      });

      const uploadResults = await Promise.all(uploadPromises);
      setResponses(uploadResults);

      const processPromises = uploadResults.map(async (result) => {
        if (result.status === 'uploaded') {
          try {
            const processRes = await axios.post('http://localhost:5173/pipeline/assets/process', {
              key: result.key,
              pipeline: 'dragonfly-img-basic'
            });
            console.log('Process Response:', processRes.data);
            return { ...result, taskId: processRes.data.taskId, status: 'running' };
          } catch (error) {
            const errorMessage = handleApiError(error);
            return { ...result, status: 'error', error: errorMessage };
          }
        }
        return result;
      });

      const processResults = await Promise.all(processPromises);
      setResponses(processResults);

      const checkStatusInterval = setInterval(() => checkFileStatus(processResults, checkStatusInterval), 2000);
    } catch (err) {
      const errorMessage = handleApiError(err);
      setErrors([`Upload error: ${errorMessage}`]);
      setLoading(false);
      toast.error(`Upload error: ${errorMessage}`, { autoClose: 10000 });
    }
  };

  const checkFileStatus = async (processResults, checkStatusInterval) => {
    const statusPromises = processResults.map(async (result) => {
      if (result.status === 'running') {
        try {
          const statusRes = await axios.post('http://localhost:5173/pipeline/assets/status', { taskId: result.taskId });
          return { ...result, status: statusRes.data.status };
        } catch (error) {
          const errorMessage = handleApiError(error);
          return { ...result, status: 'error', error: errorMessage };
        }
      }
      return result;
    });

    const statuses = await Promise.all(statusPromises);
    setResponses(statuses);

    const allDone = statuses.every(status => status.status === 'SUCCEEDED' || status.status === 'error');
    if (allDone) {
      clearInterval(checkStatusInterval);
      setLoading(false);
      statuses.forEach(status => {
        if (status.status === 'SUCCEEDED') {
          toast.success(` ${status.fileName} with key ${status.key} processed successfully!`, { autoClose: 10000 });
          setFiles([]);
        } else if (status.status === 'error') {
          toast.error(`Error processing  ${status.fileName} with key ${status.key}: ${status.error}`, { autoClose: 10000 });
        }
      });
    }
  };

  const openFileDialog = () => {
    document.getElementById('fileInput').click();
  };

  return (
    <div>
      <ToastContainer />
      <div
        className="previews"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {files.length === 0 ? (
          <div className="placeholder">
            <p>Click "Choose Files" or drag and drop files into the box</p>
          </div>
        ) : (
          files.map((file, index) => (
            <div key={index} className="preview">
              <img src={URL.createObjectURL(file)} alt={`preview ${index}`} width="100%" />
            </div>
          ))
        )}
      </div>
      <div className='buttons-div'>
        <div>
          <button className='custom-button' onClick={openFileDialog}>Choose Files </button>
          <span>{files.length} file(s) selected</span>
          <input id="fileInput" type="file" multiple accept="image/jpeg,image/png" style={{ display: 'none' }} onChange={handleFileChange} />
        </div>
        
        <button className='custom-button' onClick={uploadFiles}>Upload Files</button>
      </div>
      
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Please wait...</p>
        </div>
      )}
      {errors.length > 0 && errors.map((error, index) => (
        <p key={index} style={{ color: 'red' }}>Error: {error}</p>
      ))}
    </div>
  );
};

export default ImageUploader;
