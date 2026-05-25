import fs from 'fs';
import zlib from 'zlib';
import https from 'https';

const arch = `graph TD
    subgraph Client [Frontend Client]
        UI["React 18 UI / Framer Motion / Tailwind v4"]
        Canvas["@xyflow/react Story Node Canvas"]
        DataLayer["Abstracted Data Store & Hooks"]
        
        UI --- DataLayer
        Canvas --- DataLayer
    end

    subgraph Backend [Firebase Cloud]
        Auth["Firebase Authentication"]
        RTDB["Realtime Database"]
    end

    DataLayer -->|"Cursor Pagination"| RTDB
    RTDB -->|"Realtime Listeners"| DataLayer
    DataLayer -->|"runTransaction()"| RTDB
    UI -->|"OAuth / Guest"| Auth

    style Client fill:#0f172a,stroke:#3b82f6,stroke-width:2px,color:#fff
    style Backend fill:#fef3c7,stroke:#f59e0b,stroke-width:2px,color:#000
    style RTDB fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#000
    style Auth fill:#fcd34d,stroke:#b45309,stroke-width:2px,color:#000`;

const flow = `sequenceDiagram
    participant User
    participant UI as React Component
    participant Store as Data Store
    participant DB as Firebase RTDB

    User->>UI: Submits new branch text
    UI->>Store: Validates & calls appendNode()
    Store->>DB: runTransaction(parentNode.children)
    Note right of Store: Locks parent node to prevent<br/>race conditions during high traffic
    DB-->>Store: Transaction Success
    Store->>DB: push(newNodeData)
    DB-->>Store: Trigger onValue() Listener
    Store-->>UI: Updates React State (Optimistic UI)
    UI-->>User: Instantly renders new branch on Canvas`;

function encodeAndFetch(text, filename) {
  const data = Buffer.from(text, 'utf8');
  const compressed = zlib.deflateSync(data);
  const base64 = compressed.toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
  const url = `https://kroki.io/mermaid/svg/${base64}`;
  
  https.get(url, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      fs.writeFileSync(filename, body);
      console.log(`Saved ${filename}`);
    });
  }).on('error', (e) => {
    console.error(e);
  });
}

if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
}

encodeAndFetch(arch, 'public/architecture.svg');
encodeAndFetch(flow, 'public/flow.svg');
