import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const ImageUploader = () => {
  const onDrop = useCallback(async (acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      // Generate a pre-signed URL
      axios.post('https://dev.api.dragonflyai.co/pipeline/assets/stage', {}, {
        headers: {
            'Authorization': `api_key d8352701-03d5-4f15-a187-0c1de21ee37f`,
            'Content-Type': 'application/json' // Ensure this is required or set accordingly
        }
    })
    .then(response => {
        const { url } = response.data;
    
        axios.put(url, file, {
            headers: {
                'Content-Type': file.type // Correct content type for the file being uploaded
            }
        })
        .then(() => console.log('File uploaded successfully'))
        .catch(error => console.error('Error uploading file:', error));
    })
    .catch(error => console.error('Error obtaining pre-signed URL:', error));
    
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      {
        isDragActive ?
          <p>Drop the files here ...</p> :
          <p>Drag 'n' drop some files here, or click to select files</p>
      }
    </div>
  );
};

export default ImageUploader;
