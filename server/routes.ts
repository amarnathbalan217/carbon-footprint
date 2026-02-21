import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from './db';

const router = express.Router();
const SECRET_KEY = 'super-secret-key-change-this-in-prod'; // simplistic for this demo

// Middleware to authenticate token
export const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err: any, user: any) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Middleware to check if user is admin
export const isAdmin = (req: any, res: any, next: any) => {
    const userEmail = req.user?.email?.toLowerCase();
    if (req.user && (req.user.id === 999999 || userEmail === 'admin' || userEmail === 'admin@carbontracker.com')) {
        next();
    } else {
        res.status(403).json({ error: 'Access denied: Administrator privileges required' });
    }
};

// Auth Routes
router.post('/auth/register', async (req, res) => {
    try {
        let { email, password, name } = req.body;
        email = email.toLowerCase();

        // Prevent registration with admin emails
        if (email === 'admin' || email === 'admin@carbontracker.com') {
            return res.status(403).json({ error: 'This email is reserved for administrative use.' });
        }

        const db = getDb();
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await db.run(
            'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
            [email, hashedPassword, name]
        );

        const token = jwt.sign({ id: result.lastID, email }, SECRET_KEY);
        res.json({ token, user: { id: result.lastID, email, name } });
    } catch (error: any) {
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'A user with this email already exists.' });
        }
        res.status(400).json({ error: error.message });
    }
});

router.post('/auth/login', async (req, res) => {
    try {
        let { email, password } = req.body;
        email = email.toLowerCase();

        // Hardcoded Admin Check
        if ((email === 'admin' || email === 'admin@carbontracker.com') && password === 'admin123') {
            const token = jwt.sign({ id: 999999, email }, SECRET_KEY);
            return res.json({ token, user: { id: 999999, email, name: 'Administrator' } });
        }

        const db = getDb();
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid password' });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY);
        res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Admin User Management
router.get('/admin/users', authenticateToken, isAdmin, async (req: any, res) => {
    try {
        const db = getDb();
        const users = await db.all('SELECT id, email, name, location, household_size, primary_vehicle, home_type, created_at FROM users ORDER BY created_at DESC');
        res.json(users);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Emission Factors Routes
router.get('/emission-factors', async (req, res) => {
    try {
        const db = getDb();
        const factors = await db.all('SELECT * FROM emission_factors');
        res.json(factors);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/admin/emission-factors/:id', authenticateToken, isAdmin, async (req: any, res) => {
    try {
        const { id } = req.params;
        const { factor } = req.body;
        const db = getDb();
        await db.run('UPDATE emission_factors SET factor = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [factor, id]);
        res.json({ success: true, message: 'Emission factor updated' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Recommendations Routes
router.get('/admin/recommendations', authenticateToken, isAdmin, async (req: any, res) => {
    try {
        const db = getDb();
        const recs = await db.all('SELECT * FROM recommendations ORDER BY created_at DESC');
        res.json(recs);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/admin/recommendations', authenticateToken, isAdmin, async (req: any, res) => {
    try {
        const { user_id, title, description, impact, difficulty, category, color, bg } = req.body;
        const db = getDb();
        const result = await db.run(
            'INSERT INTO recommendations (user_id, title, description, impact, difficulty, category, color, bg) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [user_id, title, description, impact, difficulty, category, color, bg]
        );
        res.json({ id: result.lastID, ...req.body });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/admin/recommendations/:id', authenticateToken, isAdmin, async (req: any, res) => {
    try {
        const { id } = req.params;
        const { user_id, title, description, impact, difficulty, category, color, bg } = req.body;
        const db = getDb();
        await db.run(
            'UPDATE recommendations SET user_id = ?, title = ?, description = ?, impact = ?, difficulty = ?, category = ?, color = ?, bg = ? WHERE id = ?',
            [user_id, title, description, impact, difficulty, category, color, bg, id]
        );
        res.json({ success: true, message: 'Recommendation updated' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/admin/recommendations/:id', authenticateToken, isAdmin, async (req: any, res) => {
    try {
        const { id } = req.params;
        const db = getDb();
        await db.run('DELETE FROM recommendations WHERE id = ?', [id]);
        res.json({ success: true, message: 'Recommendation deleted' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/auth/me', authenticateToken, async (req: any, res) => {
    try {
        const db = getDb();
        // Check if it's the hardcoded admin
        if (req.user.id === 999999) {
            return res.json({ id: 999999, email: req.user.email, name: 'Administrator' });
        }
        const user = await db.get('SELECT id, email, name, location, household_size, primary_vehicle, home_type FROM users WHERE id = ?', [req.user.id]);
        if (!user) return res.sendStatus(404);
        res.json(user);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/auth/profile', authenticateToken, async (req: any, res) => {
    try {
        const { name, location, household_size, primary_vehicle, home_type } = req.body;
        const db = getDb();
        await db.run(
            'UPDATE users SET name = ?, location = ?, household_size = ?, primary_vehicle = ?, home_type = ? WHERE id = ?',
            [name, location, household_size, primary_vehicle, home_type, req.user.id]
        );
        res.json({ success: true, message: 'Profile updated' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Activity Routes
router.get('/activities', authenticateToken, async (req: any, res) => {
    try {
        const db = getDb();
        const activities = await db.all(
            'SELECT * FROM activities WHERE user_id = ? ORDER BY date DESC',
            [req.user.id]
        );
        res.json(activities);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/activities/clear', authenticateToken, async (req: any, res) => {
    console.log('POST /activities/clear request received', req.user.id);
    try {
        const db = getDb();
        await db.run('DELETE FROM activities WHERE user_id = ?', [req.user.id]);
        res.json({ message: 'All activities cleared' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/activities', authenticateToken, async (req: any, res) => {
    try {
        const { category, subcategory, value, emissions, date } = req.body;
        const db = getDb();
        const result = await db.run(
            'INSERT INTO activities (user_id, category, subcategory, value, emissions, date) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, category, subcategory, value, emissions, date]
        );
        res.json({ id: result.lastID, ...req.body });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Travel Segments Routes
router.get('/travel', authenticateToken, async (req: any, res) => {
    try {
        const db = getDb();
        const segments = await db.all(
            'SELECT * FROM travel_segments WHERE user_id = ? ORDER BY timestamp DESC',
            [req.user.id]
        );
        res.json(segments);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/travel', authenticateToken, async (req: any, res) => {
    try {
        const { start_lat, start_lng, end_lat, end_lng, distance, transport_mode, emissions, timestamp, duration } = req.body;
        const db = getDb();
        const result = await db.run(
            `INSERT INTO travel_segments 
      (user_id, start_lat, start_lng, end_lat, end_lng, distance, transport_mode, emissions, timestamp, duration) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, start_lat, start_lng, end_lat, end_lng, distance, transport_mode, emissions, timestamp, duration]
        );
        res.json({ id: result.lastID, ...req.body });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Goals Routes
router.post('/goals/clear', authenticateToken, async (req: any, res) => {
    console.log('POST /goals/clear request received', req.user.id);
    try {
        const db = getDb();
        await db.run('DELETE FROM goals WHERE user_id = ?', [req.user.id]);
        res.json({ message: 'All goals cleared' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/goals', authenticateToken, async (req: any, res) => {
    try {
        const db = getDb();
        const goals = await db.all(
            'SELECT * FROM goals WHERE user_id = ? ORDER BY deadline ASC',
            [req.user.id]
        );
        res.json(goals);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/goals', authenticateToken, async (req: any, res) => {
    try {
        const { title, target, current, deadline, category } = req.body;
        const db = getDb();
        const result = await db.run(
            'INSERT INTO goals (user_id, title, target, current, deadline, category) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, title, target, current || 0, deadline, category]
        );
        res.json({ id: result.lastID, ...req.body, current: current || 0 });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Insights Routes
router.get('/insights', authenticateToken, async (req: any, res) => {
    console.log('GET /insights request received', req.user);
    try {
        const db = getDb();
        const userId = req.user.id;

        // Calculate total emissions
        const activities = await db.all('SELECT emissions, date, category FROM activities WHERE user_id = ?', [userId]);
        const travel = await db.all('SELECT emissions, timestamp, transport_mode, distance FROM travel_segments WHERE user_id = ?', [userId]);

        // Simple impact stats
        const totalActivityEmissions = activities.reduce((acc: number, curr: any) => acc + (curr.emissions || 0), 0);
        const totalTravelEmissions = travel.reduce((acc: number, curr: any) => acc + (curr.emissions || 0), 0);
        const totalEmissions = totalActivityEmissions + totalTravelEmissions;

        // Mock comparison data for now (since we don't have other users' aggregate data easily available/computed yet)
        const comparisons = {
            national: { value: 4.8, comparison: totalEmissions < 4.8 ? 'below' : 'above' },
            global: { value: 3.2, comparison: totalEmissions < 3.2 ? 'below' : 'above' },
            city: { value: 2.9, comparison: totalEmissions < 2.9 ? 'below' : 'above' }
        };

        // Calculate specific impact metrics
        const meatlessDays = activities.filter((a: any) => a.category === 'food' && a.subcategory === 'vegetarian').length; // Simplified assumption
        const busKm = travel.filter((t: any) => t.transport_mode === 'bus').reduce((acc: number, t: any) => acc + (t.distance || 0), 0);
        const treesEquivalent = Math.floor(totalEmissions * 45); // Approx 45 trees to offset 1 ton

        // Fetch recommendations from database (either global or targeted to this user)
        const recommendations = await db.all('SELECT * FROM recommendations WHERE user_id IS NULL OR user_id = ?', [userId]);

        res.json({
            trends: [
                { period: 'This Month', change: -5, description: 'Estimated reduction based on activity' }, // Placeholder for real trend logic
            ],
            comparisons,
            impact: {
                totalSaved: 0, // Needs a baseline to calculate "saved", for now sending 0 or could assume a baseline
                trees: treesEquivalent,
                km: Math.round(busKm),
                meatlessDays
            },
            recommendations: recommendations.map(r => ({
                id: r.id,
                user_id: r.user_id,
                title: r.title,
                description: r.description,
                impact: r.impact,
                difficulty: r.difficulty,
                category: r.category,
                color: r.color,
                bg: r.bg
            }))
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
