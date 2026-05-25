import React, { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow, Controls, Background,
  applyEdgeChanges, applyNodeChanges,
  Handle, Position, useReactFlow, ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useParams, useNavigate } from 'react-router-dom';
import { getStory, useNodesForStory } from '../store/dataStore';
import { BookOpen, Plus, Map as MapIcon, Target, Heart, GitBranch, ArrowLeft } from 'lucide-react';

const GENRE_RING = {
  'Sci-Fi': '#22d3ee', 'Fantasy': '#a78bfa', 'Cyberpunk': '#f472b6',
  'Horror': '#f87171', 'Mystery': '#fbbf24', 'default': '#6366f1',
};

const StoryNode = React.memo(({ data, selected }) => {
  const ring = GENRE_RING[data.genre] || GENRE_RING.default;
  return (
    <div className={`
      bg-slate-900 border-2 rounded-2xl shadow-2xl w-64 transition-all duration-300 group relative
      ${data.isDimmed ? 'opacity-20 grayscale scale-95' : 'opacity-100'}
      ${selected ? 'shadow-[0_0_30px_rgba(99,102,241,0.4)]' : ''}
      ${data.isCanon ? 'shadow-[0_0_20px_rgba(234,179,8,0.3)] ring-2 ring-yellow-500/50' : ''}
    `}
    style={{ borderColor: selected ? ring : data.isCanon ? '#eab308' : 'rgba(99,102,241,0.25)' }}>
      <Handle type="target" position={Position.Top}
        style={{ width: 10, height: 10, background: ring, border: '2px solid #0f172a' }} />

      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">
              {data.isRoot ? 'ORIGIN' : `#${data.id.slice(-4)}`}
            </span>
            {data.isCanon && (
              <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-500 flex items-center gap-1">
                Canon
              </span>
            )}
          </div>
          <span className="text-[9px] text-slate-600 flex items-center gap-1">
            <Heart size={8} className={data.isCanon ? "text-yellow-500/50" : ""} /> {data.likeCount || 0}
          </span>
        </div>
        <p className="text-xs text-slate-300 line-clamp-3 italic leading-relaxed font-serif mb-3">
          "{data.text}"
        </p>
        <div className="flex justify-between items-center">
          <span className="text-[9px] text-slate-600 font-bold truncate max-w-[80px]">
            {data.authorName || 'Anonymous'}
          </span>
          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={e => { e.stopPropagation(); data.onRead(data.id); }}
              title="Read"
              className="bg-slate-800 hover:bg-slate-700 text-white p-1.5 rounded-lg transition-colors"
            ><BookOpen size={11} /></button>
            <button
              onClick={e => { e.stopPropagation(); data.onBranch(data.id); }}
              title="Branch"
              className="bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 rounded-lg transition-colors"
            ><Plus size={11} /></button>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom}
        style={{ width: 10, height: 10, background: ring, border: '2px solid #0f172a' }} />
    </div>
  );
});

const nodeTypes = { storyNode: StoryNode };

const StoryCanvasContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fitView, setCenter } = useReactFlow();

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [story, setStory] = useState(null);
  const [focusId, setFocusId] = useState(null);
  
  const storyNodes = useNodesForStory(id);

  const onNodesChange = useCallback(c => setNodes(n => applyNodeChanges(c, n)), []);
  const onEdgesChange = useCallback(c => setEdges(e => applyEdgeChanges(c, e)), []);

  useEffect(() => {
    getStory(id).then(s => setStory(s));
  }, [id]);

  useEffect(() => {
    if (!storyNodes || !storyNodes.length) return;

    const genre = story?.metadata?.genre || 'default';
    const color = GENRE_RING[genre] || GENRE_RING.default;
    const rfNodes = [], rfEdges = [];
    const levels = {};

    const root = storyNodes.find(n => !n.parentId || n.isRoot) || storyNodes[0];

    // Calculate Canon Path
    const canonPathIds = new Set();
    if (root) {
      let current = root;
      while (current) {
        canonPathIds.add(current.id);
        if (!current.children || current.children.length === 0) break;
        let maxChild = null;
        let maxLikes = -1;
        current.children.forEach(cid => {
          const cNode = storyNodes.find(n => n.id === cid);
          if (cNode && (cNode.likeCount || 0) > maxLikes) {
            maxLikes = cNode.likeCount || 0;
            maxChild = cNode;
          }
        });
        current = maxChild;
      }
    }

    const buildTree = (nodeId, level = 0) => {
      const node = storyNodes.find(n => n.id === nodeId);
      if (!node) return;
      if (!levels[level]) levels[level] = 0;
      const x = levels[level] * 320;
      levels[level]++;

      const isCanon = canonPathIds.has(nodeId);

      rfNodes.push({
        id: nodeId, type: 'storyNode',
        position: { x, y: level * 260 },
        data: {
          ...node, genre,
          onRead:   (nid) => navigate(`/read/${id}/${nid}`),
          onBranch: (nid) => navigate(`/write/${nid}`),
          isDimmed: false,
          isCanon,
        },
      });

      (node.children || []).forEach(childId => {
        const isEdgeCanon = isCanon && canonPathIds.has(childId);
        rfEdges.push({
          id: `e-${nodeId}-${childId}`,
          source: nodeId, target: childId, animated: true,
          style: { 
            stroke: isEdgeCanon ? '#eab308' : color, 
            strokeWidth: isEdgeCanon ? 3 : 1.5, 
            opacity: isEdgeCanon ? 0.8 : 0.4 
          },
        });
        buildTree(childId, level + 1);
      });
    };

    if (root) buildTree(root.id);

    setNodes(rfNodes);
    setEdges(rfEdges);
    setTimeout(() => fitView({ padding: 0.25, duration: 600 }), 150);
  }, [storyNodes, story, navigate, fitView, id]);

  // Focus mode
  useEffect(() => {
    if (!focusId) {
      setNodes(ns => ns.map(n => n.data.isDimmed ? { ...n, data: { ...n.data, isDimmed: false } } : n));
      setEdges(es => es.map(e => e.style?.opacity !== 0.5 ? { ...e, animated: true, style: { ...e.style, opacity: 0.5 } } : e));
      return;
    }
    const reachable = new Set([focusId]);
    const queue = [focusId];
    while (queue.length) {
      const curr = queue.shift();
      const node = storyNodes.find(n => n.id === curr);
      (node?.children || []).forEach(c => { if (!reachable.has(c)) { reachable.add(c); queue.push(c); } });
    }
    setNodes(ns => ns.map(n => {
      const shouldDim = !reachable.has(n.id);
      if (n.data.isDimmed === shouldDim) return n;
      return { ...n, data: { ...n.data, isDimmed: shouldDim } };
    }));
    setEdges(es => es.map(e => {
      const shouldHide = !reachable.has(e.target);
      const targetOpacity = shouldHide ? 0.08 : 1;
      if (e.style?.opacity === targetOpacity) return e;
      return {
        ...e, animated: !shouldHide,
        style: { ...e.style, opacity: targetOpacity },
      };
    }));
  }, [focusId, storyNodes]);

  const handleNodeClick = (_, node) => {
    if (focusId === node.id) { setFocusId(null); return; }
    setFocusId(node.id);
    setCenter(node.position.x + 128, node.position.y + 100, { zoom: 1.3, duration: 700 });
  };

  return (
    <div className="h-[calc(100vh-64px)] w-full bg-slate-950 relative">
      {/* Info panel */}
      <div className="absolute top-6 left-6 z-10 space-y-3 max-w-xs">
        <div className="glass rounded-2xl p-5 shadow-2xl">
          <div className="flex items-center gap-2 text-indigo-400 text-[9px] font-black uppercase tracking-[0.2em] mb-2">
            <MapIcon size={11} /> Story Atlas
          </div>
          <h2 className="text-xl font-black text-white leading-tight mb-3">
            {story?.title || 'Loading…'}
          </h2>
          <div className="flex gap-4 text-[10px]">
            <div>
              <p className="text-slate-600 font-bold uppercase">Paths</p>
              <p className="text-indigo-400 font-mono font-black">{nodes.length}</p>
            </div>
            <div className="w-px bg-slate-800" />
            <div>
              <p className="text-slate-600 font-bold uppercase">Genre</p>
              <p className="text-slate-300 font-bold">{story?.metadata?.genre || '—'}</p>
            </div>
            <div className="w-px bg-slate-800" />
            <div>
              <p className="text-slate-600 font-bold uppercase">By</p>
              <p className="text-slate-300 font-bold truncate max-w-[70px]">{story?.metadata?.author || '—'}</p>
            </div>
          </div>
        </div>

        {focusId && (
          <div className="glass rounded-xl px-4 py-2.5 flex items-center gap-3 animate-in fade-in">
            <Target size={13} className="text-indigo-400" />
            <span className="text-xs font-bold text-indigo-300">Focus Mode</span>
            <button onClick={() => setFocusId(null)}
              className="ml-auto text-[9px] bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-0.5 rounded font-black uppercase transition-colors">
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Back button */}
      <button
        onClick={() => navigate('/library')}
        className="absolute top-6 right-6 z-10 glass px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-black text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={14} /> Library
      </button>

      {/* Hint */}
      <div className="absolute bottom-6 left-6 z-10 text-[10px] text-slate-700 font-bold uppercase tracking-widest">
        Click node to focus · Hover for actions
      </div>

      <ReactFlow
        nodes={nodes} edges={edges}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView className="bg-slate-950"
      >
        <Background color="#1e293b" variant="dots" gap={28} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  );
};

const StoryCanvas = () => (
  <ReactFlowProvider><StoryCanvasContent /></ReactFlowProvider>
);

export default StoryCanvas;
