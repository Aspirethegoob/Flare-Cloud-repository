const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// File: server.js

// Initialize the Express app
const app = express();
const PORT = 3000;

// Directory for uploaded files
const UPLOAD_DIR = 'uploads/';

// Ensure the upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR);
}

// Storage configuration for file uploads
const upload = multer({
    dest: UPLOAD_DIR, // Directory to store uploaded files
});

// Middleware to serve static files
app.use(express.static('public'));

// Middleware to parse JSON requests
app.use(express.json());

// API endpoint to upload files
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    // Log the uploaded file details
    console.log('File uploaded:', req.file);

    res.send({
        message: 'File uploaded successfully!',
        file: req.file,
    });
});

// API endpoint to list uploaded files
app.get('/files', (req, res) => {
    fs.readdir(UPLOAD_DIR, (err, files) => {
        if (err) {
            console.error('Error reading upload directory:', err);
            return res.status(500).send('Unable to list files.');
        }

        // Log the list of files
        console.log('Files in upload directory:', files);

        res.send(files);
    });
});

// API endpoint to download a file
app.get('/files/:filename', (req, res) => {
    const filePath = path.join(__dirname, UPLOAD_DIR, req.params.filename);

    // Log the file download request
    console.log('File download requested:', req.params.filename);

    res.download(filePath, (err) => {
        if (err) {
            console.error('Error downloading file:', err);
            res.status(404).send('File not found.');
        }
    });
});

// API endpoint to delete a file
app.delete('/files/:filename', (req, res) => {
    const filePath = path.join(__dirname, UPLOAD_DIR, req.params.filename);

    // Log the file deletion request
    console.log('File deletion requested:', req.params.filename);

    fs.unlink(filePath, (err) => {
        if (err) {
            console.error('Error deleting file:', err);
            return res.status(404).send('File not found.');
        }

        res.send({ message: 'File deleted successfully!' });
    });
});

// API endpoint to get file details
app.get('/files/:filename/details', (req, res) => {
    const filePath = path.join(__dirname, UPLOAD_DIR, req.params.filename);

    // Log the file details request
    console.log('File details requested:', req.params.filename);

    fs.stat(filePath, (err, stats) => {
        if (err) {
            console.error('Error getting file details:', err);
            return res.status(404).send('File not found.');
        }

        res.send({
            filename: req.params.filename,
            size: stats.size,
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime,
        });
    });
});

// Utility function to clean up old files
function cleanUpOldFiles() {
    fs.readdir(UPLOAD_DIR, (err, files) => {
        if (err) {
            console.error('Error reading upload directory for cleanup:', err);
            return;
        }

        const now = Date.now();
        const ONE_DAY = 24 * 60 * 60 * 1000;

        files.forEach((file) => {
            const filePath = path.join(UPLOAD_DIR, file);

            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error('Error getting file stats for cleanup:', err);
                    return;
                }

                // Delete files older than one day
                if (now - stats.mtimeMs > ONE_DAY) {
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            console.error('Error deleting old file:', err);
                        } else {
                            console.log('Deleted old file:', file);
                        }
                    });
                }
            });
        });
    });
}

// Schedule cleanup every hour
setInterval(cleanUpOldFiles, 60 * 60 * 1000);

// Start the server
app.listen(PORT, () => {
    console.log(`Flare Cloud Services running on http://localhost:${PORT}`);
    console.log('Upload directory:', UPLOAD_DIR);
});
