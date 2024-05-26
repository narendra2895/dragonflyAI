# Dragonfly Task

# Project Structure

<!-- dragonfly_task/
├── node_modules/
├── public/
├── src/
│ ├── components/
│ │ ├── ImageUploader.css
│ │ └── ImageUploader.jsx
│ ├── App.css
│ ├── App.js
│ ├── App.test.js
│ ├── index.css
│ ├── index.js
│ ├── logo-white.png
│ ├── logo.svg
│ ├── reportWebVitals.js
│ └── setupTests.js
├── api/
│ ├── node_modules/
│ ├── .env
│ ├── package-lock.json
│ ├── package.json
│ └── server.js
├── .env
├── .gitignore
├── package-lock.json
├── package.json
└── README.md -->


## Image Uploader Component

The `ImageUploader` component allows users to upload image files with the following features:
- Image compression before upload.
- File size and resolution validation.
- Supports drag-and-drop as well as file input selection.
- Displays previews of selected images.
- Uploads files to the server with a PUT request.

### `ImageUploader.jsx`

This file contains the React component for image uploading. It uses several libraries:
- `axios` for HTTP requests.
- `compressorjs` for image compression.
- `react-toastify` for toast notifications.
- `react-confirm-alert` for confirmation dialogs.

### `ImageUploader.css`

This file contains the styling for the `ImageUploader` component.

## Server

The `server.js` file sets up an Express server with the following features:
- CORS support.
- Environment variable configuration using `dotenv`.
- API endpoints to interact with a remote server for staging, processing, and checking the status of uploaded images.

### `server.js`

This file contains the server setup and three main endpoints:
1. `/pipeline/assets/stage`: Stages assets in the pipeline.
2. `/pipeline/assets/process`: Processes staged assets.
3. `/pipeline/assets/status`: Checks the status of processed assets.

## Installation

To set up the project, follow these steps:

1. Clone the repository:
    ```bash
    git clone <repository_url>
    cd dragonfly_task
    ```

2. Install dependencies in the root directory:
    ```bash
    npm install
    ```

3. Navigate to the `api` directory and install dependencies:
    ```bash
    cd api
    npm install
    ```

4. Create a `.env` file in the root and add the necessary environment variables:
    ```plaintext
    API_KEY=your_api_key
    BASE_URL=https://api.yourservice.com
    ```

5. Start the development server:
    ```bash
    npm start
    ```

## Scripts

The `package.json` file includes several scripts:

- `start`: Concurrently starts the client and server.
- `start-client`: Starts the React client.
- `start-server`: Starts the Express server.
- `build`: Builds the React application.
- `test`: Runs the tests.
- `eject`: Ejects the create-react-app configuration.

## Dependencies

The project has the following dependencies:

### Frontend

- `axios`: ^1.7.2
- `compressorjs`: ^1.2.1
- `dotenv`: ^16.4.5
- `react`: ^18.3.1
- `react-confirm-alert`: ^3.0.6
- `react-dom`: ^18.3.1
- `react-toastify`: ^10.0.5

### Backend

- `aws-sdk`: ^2.1625.0
- `axios`: ^1.7.2
- `cors`: ^2.8.5
- `dotenv`: ^16.4.5
- `express`: ^4.19.2
- `sharp`: ^0.33.4

## Usage

- To upload images, click "Choose Files" or drag and drop files into the specified area.
- Selected files will be validated and compressed before upload.
- The server handles the upload process and communicates with the remote API for staging, processing, and status checking.

## License

This project is licensed under the ISC License.
