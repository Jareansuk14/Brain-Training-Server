// server/server.js
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const userInfoRoutes = require('./routes/userInfo');
const mindmapRoutes = require('./routes/mindmap');
const meditationRoutes = require('./routes/meditation');
const goalsRoutes = require('./routes/goals'); 
const lifeDesignRoutes  = require('./routes/lifeDesign')
const activitySevenRoutes = require('./routes/activitySeven')
const activityEightRoutes = require('./routes/activityEight')
const emotionRoutes = require('./routes/emotion');
const app = express();

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user-info', userInfoRoutes); 
app.use('/api/mindmap', mindmapRoutes);
app.use('/api/meditation', meditationRoutes);
app.use('/api/goals', goalsRoutes); 
app.use('/api/life-design', lifeDesignRoutes); 
app.use('/api/activity-seven', activitySevenRoutes); 
app.use('/api/activity-eight', activityEightRoutes); 
app.use('/api/emotion', emotionRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));