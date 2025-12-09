import React from 'react';

export const BlockPalette: React.FC = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const BLOCKS = [
    { type: 'form', label: '📝 Form' },
    { type: 'function', label: '⚙️ Function' },
    { type: 'database', label: '🗄️ Database' },
    { type: 'api', label: '🌐 API' },
    { type: 'response', label: '📤 Response' }
  ];

  return (
    <div
      style={{
        width: 260,
        background: '#f8fafc',
        padding: 20,
        borderRight: '1px solid #e2e8f0',
        boxShadow: '2px 0 10px rgba(15,23,42,0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}
    >
      <h3 style={{ margin: '0 0 12px 0', color: '#0f172a' }}>Drag Blocks</h3>
      {BLOCKS.map((block) => (
        <div
          key={block.type}
          draggable
          onDragStart={(e) => onDragStart(e, block.type)}
          style={{
            padding: 12,
            borderRadius: 10,
            background: 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)',
            color: 'white',
            fontWeight: 500,
            cursor: 'grab',
            boxShadow: '0 3px 8px rgba(15,23,42,0.35)',
            textAlign: 'left'
          }}
        >
          {block.label}
        </div>
      ))}
    </div>
  );
};
