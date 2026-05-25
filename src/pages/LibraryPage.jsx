import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePaginatedStories, createStory } from '../store/dataStore';
import { useToast } from '../components/Toast';
import { BookOpen, GitBranch, Plus, X, Sparkles, Search, TrendingUp, Clock, Heart } from 'lucide-react';

const CATEGORIES = ['All', 'Trending', 'Fantasy', 'Sci-Fi', 'Mystery', 'Cyberpunk', 'Horror'];

const GENRE_COLORS = {
  'Sci-Fi':    'text-cyan-400 bg-cyan-500/10',
  'Fantasy':   'text-purple-400 bg-purple-500/10',
  'Mystery':   'text-amber-400 bg-amber-500/10',
  'Cyberpunk': 'text-pink-400 bg-pink-500/10',
  'Horror':    'text-red-400 bg-red-500/10',
};

const LibraryPage = () => {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const toast     = useToast();
  
  // Use the new Enterprise Pagination hook
  const { stories, loading, hasMore, loadMore } = usePaginatedStories(12);
  const observerTarget = useRef(null);
  
  const [showModal, setShowModal]   = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory]     = useState('All');
  const [newStory, setNewStory]     = useState({ title: '', genre: 'Fantasy', firstSentence: '' });
  const [creating, setCreating]     = useState(false);

  const filtered = useMemo(() => {
    return stories
      .filter(s => {
        const matchSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCat =
          category === 'All' ? true :
          category === 'Trending' ? (s.pathCount || 0) >= 4 :
          s.metadata?.genre === category;
        return matchSearch && matchCat;
      })
      .sort((a, b) => (b.metadata?.createdAt || 0) - (a.metadata?.createdAt || 0));
  }, [stories, searchTerm, category]);

  const trending = useMemo(() =>
    [...stories].sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))[0],
  [stories]);

  // Intersection Observer for Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newStory.title.trim() || !newStory.firstSentence.trim()) return;
    setCreating(true);
    try {
      const { storyId } = await createStory({
        title:         newStory.title.trim(),
        genre:         newStory.genre,
        firstSentence: newStory.firstSentence.trim(),
        author:        user?.displayName || 'Anonymous',
        authorId:      user?.uid || 'anon',
      });
      toast.success('Your legend has been forged!');
      setShowModal(false);
      setNewStory({ title: '', genre: 'Fantasy', firstSentence: '' });
      navigate(`/story/${storyId}`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to create story. Did you configure Firebase?');
    }
    setCreating(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 pb-32">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-5xl font-black tracking-tighter italic mb-2">The Archive</h1>
          <p className="text-slate-500 text-sm font-medium">{stories.length} living legends and counting.</p>
        </div>
        <div className="flex w-full md:w-auto gap-3">
          <div className="relative flex-grow md:w-72">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
            <input
              type="text"
              placeholder="Search legends..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all"
            />
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3.5 rounded-2xl flex items-center gap-2 transition-all shadow-2xl shadow-indigo-500/20 font-black text-xs uppercase tracking-widest shrink-0"
          >
            <Plus size={16} /> New
          </button>
        </div>
      </div>

      {/* Trending spotlight */}
      {trending && !searchTerm && category === 'All' && (
        <div
          onClick={() => navigate(`/story/${trending.id}`)}
          className="relative bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/20 rounded-[2rem] p-10 mb-12 cursor-pointer group overflow-hidden hover:border-indigo-500/40 transition-all"
        >
          <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
            <TrendingUp size={180} />
          </div>
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 bg-indigo-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest mb-5">
              <TrendingUp size={10} /> Hottest Right Now
            </span>
            <h2 className="text-4xl font-black mb-4 group-hover:text-indigo-300 transition-colors">{trending.title}</h2>
            <p className="text-slate-400 max-w-xl mb-6 text-sm leading-relaxed italic">
              The most-loved story in the archive. Join {trending.pathCount} branching paths and add your own chapter.
            </p>
            <div className="flex items-center gap-5 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-indigo-400">
                <GitBranch size={14} /> {trending.pathCount} Paths
              </span>
              <span className="text-slate-700">|</span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <Heart size={14} fill="currentColor" /> {trending.likeCount} Likes
              </span>
              <span className="text-slate-700">|</span>
              <span className="text-slate-500">By {trending.metadata?.author}</span>
            </div>
          </div>
        </div>
      )}

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-6 no-scrollbar mb-8">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border
              ${category === cat
                ? 'bg-white text-slate-950 border-white shadow-lg scale-105'
                : 'bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-700 hover:text-slate-300'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Story grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(story => {
          const genreStyle = GENRE_COLORS[story.metadata?.genre] || 'text-slate-400 bg-slate-500/10';
          const age = Math.floor((Date.now() - (story.metadata?.createdAt || 0)) / 86400000);
          return (
            <div
              key={story.id}
              onClick={() => navigate(`/story/${story.id}`)}
              className="group bg-slate-900 border border-slate-800 rounded-[1.75rem] p-7 hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all cursor-pointer flex flex-col justify-between hover:-translate-y-1"
            >
              <div>
                <div className="flex justify-between items-start mb-5">
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${genreStyle}`}>
                    {story.metadata?.genre || 'Fiction'}
                  </span>
                  <span className="text-[10px] text-slate-700 font-bold flex items-center gap-1">
                    <Clock size={10} /> {age === 0 ? 'Today' : `${age}d ago`}
                  </span>
                </div>
                <h3 className="text-xl font-black mb-2 group-hover:text-indigo-400 transition-colors leading-tight">
                  {story.title}
                </h3>
                <p className="text-xs text-slate-600 font-medium">By {story.metadata?.author || 'Anonymous'}</p>
              </div>

              <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-800">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                  <GitBranch size={12} className="text-indigo-500/60" />
                  {story.pathCount || 0} paths
                </span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                  <Heart size={12} className="text-rose-500/60" />
                  {story.likeCount || 0}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && !loading && (
        <div className="text-center py-32">
          <p className="text-2xl font-black text-slate-800 italic">No legends found…</p>
          <p className="text-slate-700 mt-3 text-sm">Be the first to write one.</p>
        </div>
      )}

      {/* Infinite Scroll Trigger & Loader */}
      {hasMore && (
        <div ref={observerTarget} className="py-12 flex justify-center">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 border-2 border-indigo-500/20 rounded-full" />
            <div className="absolute inset-0 border-2 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        </div>
      )}

      {!hasMore && filtered.length > 0 && (
        <div className="text-center py-12 text-[10px] font-black text-slate-700 uppercase tracking-widest">
          You have reached the edge of the Archive.
        </div>
      )}

      {/* Create Story Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
          <div className="bg-slate-900 border border-white/5 w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black flex items-center gap-3 italic">
                <Sparkles className="text-indigo-500" size={22} /> Forge a Legend
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-600 hover:text-white transition-colors p-1">
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Title</label>
                <input
                  type="text"
                  value={newStory.title}
                  onChange={e => setNewStory({ ...newStory, title: e.target.value })}
                  placeholder="The Eternal Horizon..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3.5 text-white text-sm focus:outline-none focus:border-indigo-500/60 transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Genre</label>
                <select
                  value={newStory.genre}
                  onChange={e => setNewStory({ ...newStory, genre: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3.5 text-white text-sm focus:outline-none focus:border-indigo-500/60 transition-all appearance-none"
                >
                  {CATEGORIES.slice(2).map(g => <option key={g}>{g}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Opening Line</label>
                <textarea
                  value={newStory.firstSentence}
                  onChange={e => setNewStory({ ...newStory, firstSentence: e.target.value })}
                  placeholder="How does it all begin?"
                  rows={4}
                  maxLength={500}
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3.5 text-white text-sm focus:outline-none focus:border-indigo-500/60 transition-all resize-none font-serif italic"
                  required
                />
                <p className="text-[10px] text-slate-600 mt-1 text-right">{newStory.firstSentence.length}/500</p>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full bg-white text-slate-950 font-black py-4 rounded-2xl transition-all shadow-xl hover:bg-slate-100 disabled:opacity-50 text-sm uppercase tracking-widest"
              >
                {creating ? 'Forging...' : 'Breathe Life Into It'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryPage;
