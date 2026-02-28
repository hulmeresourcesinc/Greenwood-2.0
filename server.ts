import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database('coordinator.db');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    pin TEXT NOT NULL,
    zipcode TEXT,
    state TEXT,
    land_zone TEXT,
    interests TEXT
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    goals TEXT,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    is_public BOOLEAN DEFAULT 1,
    soil_type TEXT,
    resources TEXT,
    outcome TEXT,
    time_commitment TEXT,
    ai_plan TEXT,
    sub_goals TEXT,
    grid_map TEXT,
    FOREIGN KEY(owner_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS memberships (
    user_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    role TEXT DEFAULT 'member',
    PRIMARY KEY(user_id, project_id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS join_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );
`);

// Migration: Add sub_goals to projects if missing
const tableInfo = db.prepare("PRAGMA table_info(projects)").all();
const hasSubGoals = tableInfo.some((col: any) => col.name === 'sub_goals');
if (!hasSubGoals) {
  db.exec("ALTER TABLE projects ADD COLUMN sub_goals TEXT");
}

const hasGridMap = tableInfo.some((col: any) => col.name === 'grid_map');
if (!hasGridMap) {
  db.exec("ALTER TABLE projects ADD COLUMN grid_map TEXT");
}


async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auth Routes
  app.post('/api/auth/login', (req, res) => {
    const { userId, pin } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE id = ? AND pin = ?').get(userId, pin);
    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, message: 'Invalid ID or PIN' });
    }
  });

  app.post('/api/auth/register', (req, res) => {
    const { userId, pin } = req.body;
    try {
      db.prepare('INSERT INTO users (id, pin) VALUES (?, ?)').run(userId, pin);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ success: false, message: 'User ID already exists' });
    }
  });

  // Project Routes
  app.get('/api/projects', (req, res) => {
    const { userId } = req.query;
    // Return public projects OR projects where user is a member/owner
    const projects = db.prepare(`
      SELECT p.* FROM projects p
      WHERE p.is_public = 1
      OR p.owner_id = ?
      OR EXISTS (SELECT 1 FROM memberships m WHERE m.project_id = p.id AND m.user_id = ?)
    `).all(userId, userId);
    res.json(projects);
  });

  app.get('/api/projects/:id', (req, res) => {
    const { id } = req.params;
    const { userId } = req.query;
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isMember = db.prepare('SELECT 1 FROM memberships WHERE project_id = ? AND user_id = ?').get(id, userId) || project.owner_id === userId;
    
    if (project.is_public === 0 && !isMember) {
      return res.status(403).json({ message: 'Private project' });
    }

    // Parse sub_goals
    if (project.sub_goals) {
      try {
        project.sub_goals = JSON.parse(project.sub_goals);
      } catch (e) {
        project.sub_goals = [];
      }
    } else {
      project.sub_goals = [];
    }

    res.json({ ...project, isMember });
  });

  app.post('/api/projects', (req, res) => {
    const { id, owner_id, name, description, goals, lat, lng, is_public, soil_type, resources, outcome, time_commitment, ai_plan, sub_goals, grid_map } = req.body;
    try {
      db.prepare(`
        INSERT INTO projects (id, owner_id, name, description, goals, lat, lng, is_public, soil_type, resources, outcome, time_commitment, ai_plan, sub_goals, grid_map)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, owner_id, name, description, goals, lat, lng, is_public ? 1 : 0, soil_type, resources, outcome, time_commitment, ai_plan, JSON.stringify(sub_goals || []), grid_map || null);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Failed to create project:', error);
      res.status(500).json({ success: false, message: error.message || 'Database error' });
    }
  });

  app.put('/api/projects/:id', (req, res) => {
    const { id } = req.params;
    const { userId, name, description, goals, is_public, soil_type, resources, outcome, time_commitment, ai_plan, sub_goals, grid_map } = req.body;
    
    // Authorization check
    const project = db.prepare('SELECT owner_id FROM projects WHERE id = ?').get(id);
    if (!project || project.owner_id !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    db.prepare(`
      UPDATE projects SET name = ?, description = ?, goals = ?, is_public = ?, soil_type = ?, resources = ?, outcome = ?, time_commitment = ?, ai_plan = ?, sub_goals = ?, grid_map = ?
      WHERE id = ?
    `).run(name, description, goals, is_public ? 1 : 0, soil_type, resources, outcome, time_commitment, ai_plan, JSON.stringify(sub_goals || []), grid_map || null, id);
    res.json({ success: true });
  });

  // User Profile
  app.put('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const { zipcode, state, land_zone, interests, pin } = req.body;
    
    if (pin) {
      db.prepare(`
        UPDATE users SET zipcode = ?, state = ?, land_zone = ?, interests = ?, pin = ?
        WHERE id = ?
      `).run(zipcode, state, land_zone, interests, pin, id);
    } else {
      db.prepare(`
        UPDATE users SET zipcode = ?, state = ?, land_zone = ?, interests = ?
        WHERE id = ?
      `).run(zipcode, state, land_zone, interests, id);
    }
    res.json({ success: true });
  });

  // Join Requests
  app.post('/api/projects/:id/join', (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;
    db.prepare('INSERT INTO join_requests (user_id, project_id) VALUES (?, ?)').run(userId, id);
    res.json({ success: true });
  });

  app.get('/api/dashboard/:userId', (req, res) => {
    const { userId } = req.params;
    const myProjects = db.prepare('SELECT * FROM projects WHERE owner_id = ?').all(userId);
    const parsedProjects = myProjects.map((p: any) => ({
      ...p,
      sub_goals: JSON.parse(p.sub_goals || '[]'),
      is_public: p.is_public === 1
    }));

    const pendingRequests = db.prepare(`
      SELECT jr.*, u.id as requester_id, p.name as project_name
      FROM join_requests jr
      JOIN users u ON jr.user_id = u.id
      JOIN projects p ON jr.project_id = p.id
      WHERE p.owner_id = ? AND jr.status = 'pending'
    `).all(userId);
    res.json({ myProjects: parsedProjects, pendingRequests });
  });

  app.post('/api/requests/:requestId/respond', (req, res) => {
    const { requestId } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'
    const request = db.prepare('SELECT * FROM join_requests WHERE id = ?').get(requestId);
    
    db.prepare('UPDATE join_requests SET status = ? WHERE id = ?').run(status, requestId);
    
    if (status === 'approved') {
      db.prepare('INSERT INTO memberships (user_id, project_id) VALUES (?, ?)').run(request.user_id, request.project_id);
    }
    res.json({ success: true });
  });

  // Info Feed (Real-time discovery via Gemini Search + API fallbacks)
  app.get('/api/feed', async (req, res) => {
    const { zipcode, land_zone } = req.query;
    
    if (!zipcode) {
      return res.json([
        { id: 1, type: 'News', title: 'Welcome to LocalCoord', content: 'Set your zipcode in your profile to see hyper-local updates.' },
      ]);
    }

    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      
      // We use Google Search grounding to find REAL events from Facebook, Meetup, and local sources
      // This is more reliable than direct API calls which require complex OAuth/App Review for public events
      const prompt = `Find 3-4 REAL upcoming local gardening, sustainability, or community garden events/meetings near Zipcode ${zipcode}. 
      Search specifically for events on Facebook Groups, Meetup.com, and local community boards.
      
      Return a JSON array of objects with: 
      id (number), 
      type ('News', 'Warning', or 'Update'), 
      title (string), 
      content (string),
      url (string - link to the event if found).
      
      Focus on:
      1. Sustainability meetings
      2. Garden workdays
      3. Plant swaps
      4. Environmental workshops
      
      If no specific events are found for this week, provide highly relevant seasonal advice for USDA Zone ${land_zone || 'unknown'}.
      Keep titles under 50 characters and content under 120 characters.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json"
        }
      });

      const feed = JSON.parse(response.text || '[]');
      
      // Add grounding metadata if available (links)
      const groundedFeed = feed.map((item: any, index: number) => {
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks && chunks[index]?.web?.uri) {
          return { ...item, url: chunks[index].web.uri };
        }
        return item;
      });

      res.json(groundedFeed);
    } catch (error) {
      console.error('AI Feed generation failed:', error);
      res.json([
        { id: 1, type: 'News', title: 'Connection Error', content: 'We had trouble reaching local event servers. Please try again later.' }
      ]);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
