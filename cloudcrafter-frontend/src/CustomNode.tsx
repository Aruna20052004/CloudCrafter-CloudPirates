import type { NodeProps } from 'reactflow';
import { Handle, Position } from 'reactflow';
import 'reactflow/dist/style.css';

export const CustomNode = ({ data }: NodeProps) => {
  const blockType = (data as any).blockType ?? 'default';
  const label = (data as any).label ?? 'Node';

  const colors: Record<string, string> = {
    form: '#10b981',
    function: '#f59e0b',
    database: '#3b82f6',
    api: '#8b5cf6',
    response: '#ef4444',
    default: '#6b7280'
  };

  const getColor = (type: string) => colors[type] || colors.default;

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 12,
        background: 'white',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        border: `3px solid ${getColor(blockType)}`,
        minWidth: 120,
        textAlign: 'center',
        fontWeight: 500,
        position: 'relative'
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#999', width: 10, height: 10, borderRadius: '50%' }}
      />
      <div style={{ fontSize: 14, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 12, color: '#6b7280' }}>{blockType.toUpperCase()}</div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#999', width: 10, height: 10, borderRadius: '50%' }}
      />
    </div>
  );
};
