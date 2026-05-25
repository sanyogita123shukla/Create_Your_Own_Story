import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getNode, getAncestryPath, createNode } from '../store/dataStore';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import { ChevronLeft, History, Send, Sparkles, Save, Users, AlertCircle, BookOpen } from 'lucide-react';

const MAX_CHARS = 500;

const Workspace = () => {
  const { nodeId } = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const toast      = useToast();

  const [parentNode, setParentNode] = useState(null);
  const [path, setPath]             = useState([]);
  const [text, setText]             = useState('');
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lastSaved, setLastSaved]   = useState(null);

  // Draft auto-save
  useEffect(() => {
    const draft = localStorage.getItem(`gw_draft_${nodeId}`);
    if (draft) setText(draft);
  }, [nodeId]);

  useEffect(() => {
    if (!text) return;
    localStorage.setItem(`gw_draft_${nodeId}`, text);
    setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, [text, nodeId]);

  // Load context
  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const n = await getNode(nodeId);
      if (!active) return;
      if (n) {
        setParentNode(n);
        const p = await getAncestryPath(nodeId);
        if (active) setPath(p);
      } else {
        setPath([{ id: nodeId, text: 'The beginning of a new chapter…' }]);
      }
      setLoading(false);
    };
    load();
    return () => { active = false; };
  }, [nodeId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || text.length > MAX_CHARS) return;
    setSubmitting(true);
    try {
      await createNode({
        text:       text.trim(),
        authorId:   user?.uid          || 'anon',
        authorName: user?.displayName  || 'Anonymous',
        parentId:   nodeId,
        storyId:    parentNode?.storyId,
      });
      localStorage.removeItem(`gw_draft_${nodeId}`);
      toast.success('Your branch has been woven into the legend!');
      navigate(`/story/${parentNode?.storyId}`);
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong. Try again.');
      setSubmitting(false);
    }
  };

  const charLeft    = MAX_CHARS - text.length;
  const isOverLimit = text.length > MAX_CHARS;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] animate-pulse">Summoning context…</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 pb-32">
      {/* Top bar */}
      <div className="flex justify-between items-center mb-14">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-white text-xs font-bold transition-all group glass px-4 py-2.5 rounded-xl"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Abandon Draft
        </button>

        <div className="flex items-center gap-4">
          {lastSaved && (
            <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
              <Save size={11} /> Saved {lastSaved}
            </div>
          )}
          <div className="glass px-4 py-2 rounded-xl flex items-center gap-2">
            <Users size={13} className="text-indigo-400" />
            <span className="text-[10px] font-bold text-slate-500">
              {user?.avatar || '✨'} {user?.displayName || 'Guest'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Story timeline */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass rounded-[2rem] p-8 shadow-2xl">
            <div className="flex items-center gap-2 text-indigo-400 text-[9px] font-black uppercase tracking-[0.3em] mb-8">
              <History size={13} /> Legacy Timeline
            </div>
            <div className="relative">
              {path.map((step, index) => (
                <div key={step.id} className="relative pl-6 pb-8 last:pb-0">
                  {index < path.length - 1 && (
                    <div className="absolute left-[3px] top-3 bottom-0 w-px bg-slate-800" />
                  )}
                  <div className={`absolute left-0 top-1.5 w-2 h-2 rounded-full transition-all
                    ${index === path.length - 1
                      ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]'
                      : 'bg-slate-700'}`}
                  />
                  <p className={`font-serif italic leading-relaxed
                    ${index === path.length - 1
                      ? 'text-base text-slate-200'
                      : 'text-xs text-slate-600 line-clamp-2'}`}
                  >
                    "{step.text}"
                  </p>
                  {step.authorName && index < path.length - 1 && (
                    <p className="text-[9px] text-slate-700 font-bold mt-1">{step.authorName}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Writing tips */}
          <div className="glass rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-slate-600 text-[9px] font-black uppercase tracking-widest mb-3">
              <BookOpen size={11} /> Writer's Guide
            </div>
            <p className="text-[10px] text-slate-700 font-bold">• Continue naturally from the last fragment</p>
            <p className="text-[10px] text-slate-700 font-bold">• Be vivid — show, don't tell</p>
            <p className="text-[10px] text-slate-700 font-bold">• Leave the next writer a hook to grab</p>
            <p className="text-[10px] text-slate-700 font-bold">• Max {MAX_CHARS} characters per branch</p>
          </div>
        </div>

        {/* Writing area */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-between items-end">
              <div className="flex items-center gap-2 text-indigo-400 text-[9px] font-black uppercase tracking-[0.3em]">
                <Sparkles size={13} /> Carve the Next Chapter
              </div>
              <span className="text-[10px] text-slate-600 font-bold glass px-3 py-1.5 rounded-lg">
                Branching from #{nodeId.slice(-4)}
              </span>
            </div>

            <div className="relative">
              {parentNode?.text && (
                <div className="absolute -top-5 left-8 right-8 text-center pointer-events-none select-none">
                  <p className="text-xs text-slate-700 italic font-serif truncate">
                    …{parentNode.text.slice(-60)}
                  </p>
                </div>
              )}

              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="What happens next?…"
                className={`w-full h-80 bg-slate-900 border rounded-[2rem] p-10 text-xl text-white placeholder-slate-800
                  focus:outline-none transition-all resize-none shadow-2xl font-serif italic leading-relaxed
                  selection:bg-indigo-500/20
                  ${isOverLimit
                    ? 'border-red-500/50 focus:border-red-500'
                    : 'border-slate-800 focus:border-indigo-500/40'}`}
              />

              <div className="absolute bottom-6 right-6 flex items-center gap-2 glass px-4 py-2.5 rounded-xl">
                <span className={`text-lg font-mono font-black
                  ${isOverLimit ? 'text-red-400 animate-pulse' : charLeft < 50 ? 'text-amber-400' : 'text-indigo-400'}`}>
                  {text.length}
                </span>
                <span className="text-slate-700 font-bold">/</span>
                <span className="text-slate-700 font-mono font-black text-lg">{MAX_CHARS}</span>
              </div>
            </div>

            {isOverLimit && (
              <div className="flex items-center gap-3 bg-red-950/40 border border-red-500/20 px-5 py-3 rounded-2xl animate-in fade-in">
                <AlertCircle size={16} className="text-red-400 shrink-0" />
                <p className="text-xs font-bold text-red-400">{Math.abs(charLeft)} characters over the limit. Trim your fragment.</p>
              </div>
            )}

            <div className="flex justify-between items-center pt-4">
              <p className="text-[10px] text-slate-700 uppercase tracking-widest font-bold max-w-[220px] leading-relaxed">
                By publishing, you commit these words to the infinite tapestry.
              </p>
              <button
                type="submit"
                disabled={!text.trim() || isOverLimit || submitting}
                className="group bg-white text-slate-950 px-12 py-5 rounded-2xl font-black transition-all shadow-2xl hover:scale-105 active:scale-95 disabled:opacity-20 disabled:grayscale text-sm uppercase tracking-[0.15em] flex items-center gap-3"
              >
                <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                {submitting ? 'Publishing…' : 'Publish Branch'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Workspace;
