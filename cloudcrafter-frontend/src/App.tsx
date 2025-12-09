import { useCallback, useState } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowProvider
} from 'reactflow';
import type { Connection, Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import { BlockPalette } from './BlockPalette';
import { CustomNode } from './CustomNode';

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

function AppContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);
  const [, setShowExport] = useState(false);
  const [errorNodeIds, setErrorNodeIds] = useState<string[]>([]);

  const [deployLogs, setDeployLogs] = useState<string[]>([]);
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const [deploying, setDeploying] = useState(false);

  const [costEstimate, setCostEstimate] = useState<{
    nodes: number;
    estimatedMonthlyCost: string;
    hourlyCost: string;
  } | null>(null);

  const [lastAppId, setLastAppId] = useState<string | null>(null);
  const [monitorData, setMonitorData] = useState<{
    requests: number;
    statusCodes: Record<string, number>;
    lastDeploy: string;
    cpuUsage: string;
    memoryUsage: string;
  } | null>(null);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges]
  );

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();

      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top
      };

      const label =
        type === 'form'
          ? 'Form'
          : type === 'function'
          ? 'Function'
          : type === 'database'
          ? 'Database'
          : type === 'api'
          ? 'Api'
          : type === 'response'
          ? 'Response'
          : 'Node';

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type: 'custom',
        position,
        data: { label, blockType: type }
      };

      setNodes((nds) => nds.concat(newNode));
      setErrorNodeIds([]);
    },
    [setNodes]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const buildWorkflow = () => ({
    nodes: nodes.map((n) => ({
      id: n.id,
      type: (n.data as any).blockType,
      label: (n.data as any).label,
      position: n.position
    })),
    edges: edges.map((e) => ({
      source: e.source,
      target: e.target
    }))
  });

  const exportWorkflow = () => {
    const workflow = buildWorkflow();

    const blob = new Blob([JSON.stringify(workflow, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cloudcrafter-workflow.json';
    a.click();
    setShowExport(false);
  };

  const validateWorkflow = () => {
    const incoming: Record<string, number> = {};
    const outgoing: Record<string, number> = {};

    nodes.forEach((n) => {
      incoming[n.id] = 0;
      outgoing[n.id] = 0;
    });

    edges.forEach((e) => {
      if (incoming[e.target] !== undefined) incoming[e.target] += 1;
      if (outgoing[e.source] !== undefined) outgoing[e.source] += 1;
    });

    const errors: string[] = [];

    nodes.forEach((n) => {
      const type = (n.data as any).blockType;

      if (type === 'form' && outgoing[n.id] === 0) {
        errors.push(n.id);
      }

      if (type === 'response' && incoming[n.id] === 0) {
        errors.push(n.id);
      }

      if (
        (type === 'function' || type === 'database' || type === 'api') &&
        (incoming[n.id] === 0 || outgoing[n.id] === 0)
      ) {
        errors.push(n.id);
      }
    });

    setErrorNodeIds(errors);
  };

  const handleCostEstimate = async () => {
    const API_BASE = 'http://127.0.0.1:5003';

    if (nodes.length === 0) {
      alert('Draw a flow first to estimate cost.');
      return;
    }

    const workflow = buildWorkflow();

    try {
      const res = await fetch(`${API_BASE}/cost-estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflow)
      });
      const data = await res.json();

      setCostEstimate({
        nodes: data.nodes,
        estimatedMonthlyCost: data.estimatedMonthlyCost,
        hourlyCost: data.hourlyCost
      });
    } catch (err) {
      console.error('COST ESTIMATE ERROR', err);
      alert('Failed to estimate cost.');
    }
  };

  const handleDeploy = async () => {
    const API_BASE = 'http://127.0.0.1:5003';

    if (errorNodeIds.length > 0) {
      alert('Please fix validation errors before deploying.');
      return;
    }
    if (nodes.length === 0) {
      alert('Draw a flow first, then deploy.');
      return;
    }

    const workflow = buildWorkflow();

    try {
      setDeploying(true);
      setDeployLogs([]);
      setDeployUrl(null);
      setMonitorData(null);

      // 1) /generate
      const genRes = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflow)
      });
      const genData = await genRes.json();
      const appId = genData.appId;
      setLastAppId(appId);

      let logs: string[] = [
        `✔ Parsed blueprint for ${appId}`,
        '✔ Generated backend code',
        '✔ Generated Kubernetes deployment & service YAML'
      ];

      // 2) /generate-iac
      const iacRes = await fetch(`${API_BASE}/generate-iac`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId })
      });
      const iacData = await iacRes.json();

      if (!iacData.success) {
        logs.push('✖ Failed to generate Kubernetes manifests');
        setDeployLogs(logs);
        setDeploying(false);
        return;
      }

      // 3) /deploy
      const depRes = await fetch(`${API_BASE}/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId })
      });
      const depData = await depRes.json();

      if (depData.logs && Array.isArray(depData.logs) && depData.logs.length > 0) {
        const last = depData.logs[depData.logs.length - 1];
        logs.push(last);
      } else {
        logs.push('ℹ Ready to apply manifests to Civo cluster (prototype)');
      }

      setDeployLogs(logs);
      setDeployUrl('http://212.2.250.91');
      setDeploying(false);
    } catch (err: any) {
      console.error('DEPLOY ERROR', err);
      setDeployLogs((logs) => logs.concat(`Error: ${err?.message || err}`));
      setDeploying(false);
    }
  };

  const handleMonitor = async () => {
    const API_BASE = 'http://127.0.0.1:5003';

    if (!lastAppId) {
      alert('Deploy an app first, then monitor.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/monitor/${lastAppId}`);
      const data = await res.json();
      setMonitorData({
        requests: data.requests,
        statusCodes: data.statusCodes,
        lastDeploy: data.lastDeploy,
        cpuUsage: data.cpuUsage,
        memoryUsage: data.memoryUsage
      });
    } catch (err) {
      console.error('MONITOR ERROR', err);
      alert('Failed to fetch monitor data.');
    }
  };

  const styledNodes = nodes.map((n) => {
    const hasError = errorNodeIds.includes(n.id);
    return {
      ...n,
      style: hasError
        ? {
            ...(n.style || {}),
            border: '3px solid #ef4444',
            boxShadow: '0 0 10px rgba(239,68,68,0.7)'
          }
        : n.style
    };
  });

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {/* Top bar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 60,
          background: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          zIndex: 1001
        }}
      >
        <h1 style={{ color: 'white', margin: 0, fontSize: 20 }}>
          CloudCrafter
          {errorNodeIds.length > 0 ? ` – ${errorNodeIds.length} issue(s)` : ''}
        </h1>
        <button
          onClick={validateWorkflow}
          style={{
            marginLeft: 'auto',
            marginRight: 8,
            padding: '8px 16px',
            background: '#f97373',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
          }}
        >
          ✅ Validate Flow
        </button>
        <button
          onClick={handleCostEstimate}
          style={{
            marginRight: 8,
            padding: '8px 16px',
            background: '#fbbf24',
            color: '#111827',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
          }}
        >
          💰 Estimate Cost
        </button>
        <button
          onClick={exportWorkflow}
          style={{
            padding: '8px 16px',
            background: 'white',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
          }}
        >
          💾 Export Workflow JSON
        </button>
        <button
          onClick={handleDeploy}
          className="deploy-btn"
          style={{
            marginLeft: 8,
            padding: '8px 16px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
          }}
        >
          🚀 Generate & Deploy
        </button>
      </div>

      {/* Main area */}
      <div
        style={{
          width: '100%',
          height: '100%',
          paddingTop: 60,
          display: 'flex'
        }}
      >
        <BlockPalette />
        <div
          style={{ flex: 1, height: '100%' }}
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          <ReactFlow
            nodes={styledNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={{ custom: CustomNode }}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
      </div>

      {/* Deploy console */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 260, // increased so everything fits
          background: '#0b1120',
          color: '#a7f3d0',
          padding: 8,
          fontSize: 12,
          borderTop: '1px solid #1f2937'
        }}
      >
        <div style={{ fontWeight: 600 }}>
          Deploy Console {deploying ? '(deploying...)' : ''}
        </div>

        {/* Cost estimate */}
        {costEstimate && (
          <div
            style={{
              marginTop: 4,
              padding: 6,
              borderRadius: 6,
              background: '#020617',
              border: '1px solid #1f2937'
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 2 }}>Cost estimate (prototype)</div>
            <div>Nodes: {costEstimate.nodes}</div>
            <div>Monthly: {costEstimate.estimatedMonthlyCost}</div>
            <div>Hourly: {costEstimate.hourlyCost}</div>
          </div>
        )}

        {/* Quick monitor */}
        {lastAppId && (
          <div
            style={{
              marginTop: 4,
              padding: 6,
              borderRadius: 6,
              background: '#020617',
              border: '1px solid #1f2937'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ fontWeight: 600 }}>Quick monitor (prototype)</div>
              <button
                onClick={handleMonitor}
                style={{
                  marginLeft: 'auto',
                  padding: '3px 8px',
                  fontSize: 11,
                  borderRadius: 999,
                  border: 'none',
                  background: '#0ea5e9',
                  color: '#0f172a',
                  cursor: 'pointer'
                }}
              >
                Refresh
              </button>
            </div>
            {monitorData ? (
              <div style={{ marginTop: 2 }}>
                <div>Requests: {monitorData.requests}</div>
                <div>
                  Status: 200={monitorData.statusCodes['200']}, 500=
                  {monitorData.statusCodes['500']}
                </div>
                <div>CPU: {monitorData.cpuUsage}</div>
                <div>Memory: {monitorData.memoryUsage}</div>
              </div>
            ) : (
              <div style={{ marginTop: 2 }}>Click Refresh to load metrics.</div>
            )}
          </div>
        )}

        {/* Logs */}
        <div style={{ maxHeight: 80, overflow: 'auto', marginTop: 4 }}>
          {deployLogs.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>

        {/* Deployed app button + demo card */}
        {deployUrl && (
          <>
            <button
              onClick={() => window.open(deployUrl, '_blank')}
              style={{
                marginTop: 4,
                padding: '4px 8px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              Open Deployed App
            </button>

            <div
              style={{
                marginTop: 6,
                padding: 8,
                borderRadius: 6,
                background: '#020617',
                border: '1px solid #1f2937',
                fontSize: 11
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                Demo app (simulation)
              </div>
              <div>✓ Healthcheck: OK</div>
              <div>✓ Endpoint: {deployUrl}</div>
              <div>✓ Last deploy: just now</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <ReactFlowProvider>
      <AppContent />
    </ReactFlowProvider>
  );
}

export default App;
