import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getNode, getAncestryPath, toggleNodeLike, isNodeLiked } from '../store/dataStore';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import {
  ChevronLeft, GitBranch, ArrowRight, Volume2, VolumeX,
  Sparkles, Heart, BookOpen, Clock, User
} from 'lucide-react';

const ReaderPage = () => {
  const { storyId, nodeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [node, setNode]           = useState(null);
  const [children, setChildren]   = useState([]);
  const [path, setPath]           = useState([]);
  const [liked, setLiked]         = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isNarrating, setIsNarrating] = useState(false);
  const [loading, setLoading]     = useState(true);
  const [isLiking, setIsLiking]   = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      window.speechSynthesis.cancel();
      setIsNarrating(false);

      const n = await getNode(nodeId);
      if (!n || !active) { 
        if (active) setLoading(false); 
        return; 
      }

      setNode(n);
      setLikeCount(n.likeCount || 0);
      
      const isLiked = await isNodeLiked(nodeId, user?.uid || 'anon');
      if (active) setLiked(isLiked);

      // Children
      const childPromises = (n.children || []).map(cid => getNode(cid));
      const childNodes = (await Promise.all(childPromises)).filter(Boolean);
      if (active) setChildren(childNodes);

      // Ancestry path for breadcrumb timeline
      const p = await getAncestryPath(nodeId);
      if (active) setPath(p);
      if (active) setLoading(false);
    };
    
    load();
    return () => { active = false; };
  }, [nodeId, user]);

  const handleLike = async () => {
    if (isLiking) return; // Prevent spam clicking
    setIsLiking(true);

    // OPTIMISTIC UI: Instantly update the screen so it feels zero-latency
    const expectedLikedState = !liked;
    setLiked(expectedLikedState);
    setLikeCount(prev => prev + (expectedLikedState ? 1 : -1));

    // Actually perform the network request
    const nowLiked = await toggleNodeLike(nodeId, user?.uid || 'anon');
    
    // Revert if the backend transaction failed (edge case)
    if (nowLiked !== expectedLikedState) {
      setLiked(nowLiked);
      setLikeCount(prev => prev + (nowLiked ? 1 : -1));
      toast.error('Network sync failed.');
    } else {
      toast.info(nowLiked ? 'Fragment liked ✨' : 'Like removed');
    }
    
    setIsLiking(false);
  };

  const toggleNarration = () => {
    if (isNarrating) {
      window.speechSynthesis.cancel();
      setIsNarrating(false);
    } else {
      const utt = new SpeechSynthesisUtterance(node.text);
      utt.rate = 0.88; utt.pitch = 1;
      utt.onend = () => setIsNarrating(false);
      window.speechSynthesis.speak(utt);
      setIsNarrating(true);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
        <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin" />
      </div>
      <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.25em] animate-pulse">Illuminating pages…</p>
    </div>
  );

  if (!node) return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
      <p className="text-2xl font-black text-slate-700 italic">Fragment not found.</p>
      <button onClick={() => navigate('/library')} className="text-indigo-400 hover:text-indigo-300 text-sm font-bold">
        ← Back to Library
      </button>
    </div>
  );

  const age = Math.floor((Date.now() - (node.timestamp || 0)) / 86400000);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 pb-32">
      {/* Top bar */}
      <div className="flex justify-between items-center mb-14">
        <button
          onClick={() => navigate(`/story/${storyId}`)}
          className="flex items-center gap-2 text-slate-500 hover:text-white transition-all group px-4 py-2 glass rounded-xl text-xs font-bold"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Map View
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleNarration}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border
              ${isNarrating
                ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/30'
                : 'glass border-white/5 text-slate-400 hover:text-white'}`}
          >
            {isNarrating ? <VolumeX size={14} /> : <Volume2 size={14} />}
            {isNarrating ? 'Silence' : 'Narrate'}
          </button>

          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all border
              ${liked
                ? 'bg-rose-950/60 border-rose-500/40 text-rose-400'
                : 'glass border-white/5 text-slate-500 hover:text-rose-400'}
              ${isLiking ? 'opacity-50 cursor-not-allowed scale-95' : 'hover:scale-105 active:scale-95'}`}
          >
            <Heart size={14} fill={liked ? 'currentColor' : 'none'} className={isLiking ? "animate-pulse" : ""} />
            {likeCount}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={nodeId}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4 }}
          className="space-y-14"
        >
          {/* Story timeline breadcrumb */}
          {path.length > 1 && (
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <BookOpen size={10} /> Story Path
              </p>
              <div className="flex flex-col gap-0">
                {path.slice(0, -1).map((step, i) => (
                  <div key={step.id} className="flex items-start gap-3 group cursor-pointer"
                    onClick={() => navigate(`/read/${storyId}/${step.id}`)}>
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-slate-700 group-hover:bg-indigo-500 transition-colors mt-1.5 shrink-0" />
                      {i < path.length - 2 && <div className="w-px h-6 bg-slate-800" />}
                    </div>
                    <p className="text-xs text-slate-600 italic font-serif leading-relaxed pb-3 group-hover:text-slate-400 transition-colors line-clamp-1">
                      {step.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main fragment */}
          <div className="relative">
            <div className="absolute -left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 via-purple-500 to-transparent rounded-full opacity-60" />
            <div className="space-y-5">
              <div className="flex items-center gap-3 text-[10px] text-slate-600 font-bold">
                <User size={11} />
                <span>{node.authorName || node.authorId?.slice(0, 8) || 'Unknown'}</span>
                <span className="text-slate-800">·</span>
                <Clock size={10} />
                <span>{age === 0 ? 'Today' : `${age}d ago`}</span>
                <span className="text-slate-800">·</span>
                <Heart size={10} className="text-rose-500/50" />
                <span>{likeCount} likes</span>
              </div>

              <p className="text-3xl md:text-4xl font-serif leading-[1.65] text-slate-100 italic">
                "{node.text}"
              </p>
            </div>
          </div>

          {/* Choices */}
          <div className="border-t border-white/5 pt-12">
            <div className="flex items-center gap-3 mb-6">
              <GitBranch size={14} className="text-indigo-400" />
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">
                {children.length > 0 ? 'The Path Diverges' : 'A Dead End Awaits Your Words'}
              </span>
            </div>

            {children.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {children.map((child, i) => (
                  <motion.button
                    key={child.id}
                    whileHover={{ scale: 1.02, y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/read/${storyId}/${child.id}`)}
                    className="group text-left bg-slate-900 border border-slate-800 hover:border-indigo-500/40 hover:bg-indigo-500/5 rounded-[1.5rem] p-6 transition-all"
                  >
                    <p className="text-sm text-slate-300 leading-relaxed mb-4 group-hover:text-white transition-colors font-serif italic line-clamp-3">
                      {child.text}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-indigo-500/50 uppercase tracking-widest">
                        Branch {i + 1}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] text-slate-700 flex items-center gap-1">
                          <Heart size={9} /> {child.likeCount || 0}
                        </span>
                        <ArrowRight size={16} className="text-slate-700 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="bg-indigo-600/5 border border-indigo-500/10 rounded-[2rem] p-10 text-center">
                <p className="text-xl text-slate-500 mb-6 font-serif italic">
                  This chapter reaches its silence… will you speak for it?
                </p>
                <button
                  onClick={() => navigate(`/write/${nodeId}`)}
                  className="inline-flex items-center gap-3 bg-white text-slate-950 px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-white/5"
                >
                  <Sparkles size={16} /> Write the Continuation
                </button>
              </div>
            )}
          </div>

          {/* Always show branch option if children exist too */}
          {children.length > 0 && (
            <div className="text-center">
              <button
                onClick={() => navigate(`/write/${nodeId}`)}
                className="inline-flex items-center gap-2 text-xs font-black text-slate-600 hover:text-indigo-400 uppercase tracking-widest transition-colors"
              >
                <GitBranch size={13} /> Add your own branch
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ReaderPage;
