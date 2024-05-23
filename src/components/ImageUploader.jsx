import React, { useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Compressor from 'compressorjs';
import './ImageUploader.css';

const ImageUploader = () => {
  const [responses, setResponses] = useState([]);
  const [errors, setErrors] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit

  const API_BASE_URL = '/api/'; // Use relative path for serverless function

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFiles = async (selectedFiles) => {
    const compressedFiles = [];

    const compressFile = (file) => new Promise((resolve, reject) => {
      new Compressor(file, {
        quality: 0.6, // Adjust the quality as needed (0.6 = 60% quality)
        success: resolve,
        error: reject
      });
    });

    try {
      for (const file of selectedFiles) {
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`File ${file.name} is too large. Please upload files smaller than 5MB.`, { autoClose: 10000 });
          return;
        }
        const compressedFile = await compressFile(file);
        compressedFiles.push(compressedFile);
      }
      setFiles(compressedFiles);
    } catch (err) {
      toast.error(`Compression error: ${err.message}`, { autoClose: 10000 });
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
      const res = await axios.post(`${API_BASE_URL}/pipeline/assets/stage`, { count: files.length });
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
            const processRes = await axios.post(`${API_BASE_URL}/pipeline/assets/process`, {
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
          const statusRes = await axios.post(`${API_BASE_URL}/pipeline/assets/status`, { taskId: result.taskId });
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
          toast.success(`File ${status.fileName} with key ${status.key} processed successfully!`, { autoClose: 10000 });
        } else if (status.status === 'error') {
          toast.error(`Error processing file ${status.fileName} with key ${status.key}: ${status.error}`, { autoClose: 10000 });
        }
      });
    }
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
            <p>Click "Upload Files" or drag and drop files into the box</p>
          </div>
        ) : (
          files.map((file, index) => (
            <div key={index} className="preview">
              <img src={URL.createObjectURL(file)} alt={`preview ${index}`} width="100%" />
            </div>
          ))
        )}
      </div>
      <input type="file" multiple accept="image/jpeg,image/png" onChange={handleFileChange} />
      <button onClick={uploadFiles}>Upload Files</button>
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
