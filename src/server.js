import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, '../static')));

// Mock data for demonstration
const mockStats = {
  total: 2053,
  active: 215,
  inactive: 1838,
  triggers: {
    "Complex": 831,
    "Webhook": 519,
    "Manual": 477,
    "Scheduled": 226
  },
  complexity: {
    "low": 720,
    "medium": 923,
    "high": 410
  },
  total_nodes: 29445,
  unique_integrations: 365,
  last_indexed: new Date().toISOString()
};

const mockWorkflows = [
  {
    id: 1,
    filename: "telegram_webhook_automation.json",
    name: "Telegram Webhook Automation",
    active: true,
    description: "Automated Telegram message processing with webhook triggers",
    trigger_type: "Webhook",
    complexity: "medium",
    node_count: 8,
    integrations: ["Telegram", "HTTP Request", "Function"],
    tags: ["messaging", "automation"],
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-20T14:45:00Z"
  },
  {
    id: 2,
    filename: "openai_data_processing.json",
    name: "OpenAI Data Processing",
    active: false,
    description: "AI-powered data analysis and processing workflow",
    trigger_type: "Manual",
    complexity: "high",
    node_count: 15,
    integrations: ["OpenAI", "Google Sheets", "PostgreSQL"],
    tags: ["ai", "data-processing"],
    created_at: "2024-01-10T09:15:00Z",
    updated_at: "2024-01-18T16:20:00Z"
  },
  {
    id: 3,
    filename: "scheduled_backup_system.json",
    name: "Scheduled Backup System",
    active: true,
    description: "Automated daily backup system for critical data",
    trigger_type: "Scheduled",
    complexity: "low",
    node_count: 5,
    integrations: ["Google Drive", "MySQL", "Email"],
    tags: ["backup", "automation"],
    created_at: "2024-01-05T08:00:00Z",
    updated_at: "2024-01-22T12:30:00Z"
  }
];

// Routes
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '../static/index.html'));
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', message: 'N8N Workflow API is running' });
});

app.get('/api/stats', (req, res) => {
  res.json(mockStats);
});

app.get('/api/workflows', (req, res) => {
  const { q = '', trigger = 'all', complexity = 'all', active_only = 'false', page = '1', per_page = '20' } = req.query;
  
  let filteredWorkflows = [...mockWorkflows];
  
  // Apply filters
  if (q) {
    const query = q.toLowerCase();
    filteredWorkflows = filteredWorkflows.filter(w => 
      w.name.toLowerCase().includes(query) ||
      w.description.toLowerCase().includes(query) ||
      w.integrations.some(i => i.toLowerCase().includes(query))
    );
  }
  
  if (trigger !== 'all') {
    filteredWorkflows = filteredWorkflows.filter(w => w.trigger_type === trigger);
  }
  
  if (complexity !== 'all') {
    filteredWorkflows = filteredWorkflows.filter(w => w.complexity === complexity);
  }
  
  if (active_only === 'true') {
    filteredWorkflows = filteredWorkflows.filter(w => w.active);
  }
  
  // Pagination
  const pageNum = parseInt(page);
  const perPage = parseInt(per_page);
  const total = filteredWorkflows.length;
  const pages = Math.ceil(total / perPage);
  const offset = (pageNum - 1) * perPage;
  const paginatedWorkflows = filteredWorkflows.slice(offset, offset + perPage);
  
  res.json({
    workflows: paginatedWorkflows,
    total,
    page: pageNum,
    per_page: perPage,
    pages,
    query: q,
    filters: { trigger, complexity, active_only: active_only === 'true' }
  });
});

app.get('/api/workflows/:filename', (req, res) => {
  const { filename } = req.params;
  const workflow = mockWorkflows.find(w => w.filename === filename);
  
  if (!workflow) {
    return res.status(404).json({ detail: 'Workflow not found' });
  }
  
  const mockRawJson = {
    name: workflow.name,
    active: workflow.active,
    nodes: [
      {
        name: "Start",
        type: "n8n-nodes-base.start",
        position: [240, 300]
      },
      {
        name: "HTTP Request",
        type: "n8n-nodes-base.httpRequest",
        position: [460, 300]
      }
    ],
    connections: {
      "Start": {
        "main": [
          [
            {
              "node": "HTTP Request",
              "type": "main",
              "index": 0
            }
          ]
        ]
      }
    }
  };
  
  res.json({
    metadata: workflow,
    raw_json: mockRawJson
  });
});

app.get('/api/workflows/:filename/download', (req, res) => {
  const { filename } = req.params;
  const workflow = mockWorkflows.find(w => w.filename === filename);
  
  if (!workflow) {
    return res.status(404).json({ detail: 'Workflow not found' });
  }
  
  const mockJson = {
    name: workflow.name,
    active: workflow.active,
    nodes: [],
    connections: {}
  };
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.json(mockJson);
});

app.get('/api/workflows/:filename/diagram', (req, res) => {
  const { filename } = req.params;
  const workflow = mockWorkflows.find(w => w.filename === filename);
  
  if (!workflow) {
    return res.status(404).json({ detail: 'Workflow not found' });
  }
  
  const diagram = `graph TD
    A[Start] --> B[HTTP Request]
    B --> C[Process Data]
    C --> D[End]
    style A fill:#b3e0ff,stroke:#0066cc
    style D fill:#ffb3b3,stroke:#cc0000`;
  
  res.json({ diagram });
});

app.get('/api/categories', (req, res) => {
  const categories = [
    "AI & Machine Learning",
    "Communication & Messaging", 
    "Data Processing & Analysis",
    "Business Process Automation",
    "Cloud Storage & File Management",
    "CRM & Sales",
    "E-commerce & Retail",
    "Marketing & Advertising",
    "Project Management",
    "Social Media Management"
  ];
  
  res.json({ categories });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ detail: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ detail: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 N8N Workflow Documentation API`);
  console.log(`📊 Server running on http://localhost:${PORT}`);
  console.log(`🔍 API Documentation: http://localhost:${PORT}/api/workflows`);
  console.log(`Press Ctrl+C to stop the server`);
});