import { createRoot } from "react-dom/client";
import "./index.css";

const root = createRoot(document.getElementById("root")!);

import("./App.tsx")
  .then(({ default: App }) => {
    root.render(<App />);
  })
  .catch((err) => {
    console.error("Failed to load App:", err);
    root.render(
      <div style={{ padding: 40, fontFamily: 'monospace', color: '#ef4444', background: '#1e1e2e', minHeight: '100vh' }}>
        <h1 style={{ color: '#fff', marginBottom: 16 }}>Erro ao carregar aplicação</h1>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>{String(err)}</pre>
        <button onClick={() => window.location.reload()} style={{ marginTop: 20, padding: '8px 16px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          Recarregar
        </button>
      </div>
    );
  });
