import express from 'express';
import cors from 'cors';
import { initDb } from './db';
import router from './routes';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

// Initialize DB
initDb().then(() => {
    // Routes
    app.use('/api', router);

    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://0.0.0.0:${PORT}`);
    });

    server.on('error', (e: any) => {
        if (e.code === 'EADDRINUSE') {
            console.error(`Port ${PORT} is already in use. Please kill the process running on this port.`);
            process.exit(1);
        } else {
            console.error('Server error:', e);
        }
    });
}).catch(err => {
    console.error('Failed to initialize database', err);
});
