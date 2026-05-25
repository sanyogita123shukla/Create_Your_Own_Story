import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, GitBranch, Heart, BookOpen, PenLine, Sparkles, ArrowRight, Users } from 'lucide-react';
import { useStories } from '../store/dataStore';

const FEATURES = [
  { icon: <GitBranch size={22} />, title: 'Branch Anywhere', desc: 'Every node in a story can split into infinite paths. Your addition lives alongside all others.', color: 'text-indigo-400 bg-indigo-500/10' },
  { icon: <Heart size={22} />,     title: 'Upvote Fragments', desc: 'Like the branches that resonate. The best writing naturally rises to the top.', color: 'text-rose-400 bg-rose-500/10' },
  { icon: <BookOpen size={22} />,  title: 'Read Any Path',    desc: 'Follow a single thread from root to leaf, or jump across branches freely.', color: 'text-purple-400 bg-purple-500/10' },
  { icon: <PenLine size={22} />,   title: 'Forge Legends',    desc: 'Start your own story with the opening line and watch the community build upon it.', color: 'text-cyan-400 bg-cyan-500/10' },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const stories  = useStories();
  const totalPaths = stories.reduce((a, s) => a + (s.pathCount || 0), 0);
  const totalLikes = stories.reduce((a, s) => a + (s.likeCount || 0), 0);

  const topStories = [...stories].sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0)).slice(0, 3);

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12 } },
  };
  const item = {
    hidden: { opacity: 0, y: 24 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-36 max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between px-6 hero-glow gap-12">
        {/* Ambient blobs */}
        <div className="absolute top-20 left-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-40 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />

        {/* Left Text Content */}
        <div className="flex-1 text-center lg:text-left z-10 flex flex-col items-center lg:items-start">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 rounded-full text-indigo-400 text-xs font-black uppercase tracking-widest mb-8"
          >
            <Sparkles size={12} /> Collaborative Storytelling
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 90, delay: 0.1 }}
            className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-none mb-8"
          >
            Create Your<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-indigo-400 to-cyan-400">
              Own Legend.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-slate-400 max-w-xl mb-12 leading-relaxed"
          >
            A collaborative universe where every story branches into infinite possibilities.
            Read, write, and vote to shape the narrative.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <button
              onClick={() => navigate('/library')}
              className="group bg-indigo-600 hover:bg-indigo-500 px-10 py-5 rounded-2xl text-base font-black flex items-center gap-3 shadow-2xl shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95"
            >
              <Play fill="white" size={18} />
              Enter the Archive
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="glass border-white/10 hover:border-indigo-500/40 px-10 py-5 rounded-2xl text-base font-black flex items-center gap-3 transition-all hover:scale-105 active:scale-95"
            >
              <PenLine size={18} />
              Claim Pen Name
            </button>
          </motion.div>

          {/* Live stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="flex items-center gap-8 mt-16 text-center lg:text-left"
          >
            {[
              { val: stories.length,  label: 'Stories' },
              { val: totalPaths,      label: 'Branches' },
              { val: totalLikes,      label: 'Total Likes' },
            ].map(({ val, label }) => (
              <div key={label}>
                <motion.p 
                  key={val}
                  initial={{ scale: 1.5, color: '#818cf8' }}
                  animate={{ scale: 1, color: '#ffffff' }}
                  className="text-3xl font-black text-white"
                >
                  {val}
                </motion.p>
                <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right 3D Cards */}
        <div className="flex-1 relative h-[500px] w-full hidden lg:block z-10" style={{ perspective: '1000px' }}>
          {topStories.map((story, i) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, x: 100, y: i * 40 - 20, rotateY: 30, rotateZ: i * -5 + 10 }}
              animate={{ opacity: 1, x: i * -40, y: i * 40 - 20, rotateY: -15, rotateZ: i * -5 + 10 }}
              whileHover={{ scale: 1.05, rotateY: 0, rotateZ: 0, zIndex: 50, x: i * -40 + 20 }}
              transition={{ duration: 0.8, delay: 0.2 + i * 0.1 }}
              onClick={() => navigate(`/story/${story.id}`)}
              className="absolute right-10 top-10 w-80 glass border-white/10 hover:border-indigo-500/50 rounded-3xl p-8 shadow-2xl cursor-pointer"
              style={{ transformStyle: 'preserve-3d', zIndex: 30 - i }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl pointer-events-none" />
              <div style={{ transform: 'translateZ(30px)' }}>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">{story.metadata?.genre || 'Fiction'}</p>
                <h3 className="text-2xl font-black mb-4 leading-tight text-white">{story.title}</h3>
                <p className="text-sm text-slate-400 line-clamp-3 mb-6 italic font-serif">
                  A story authored by {story.metadata?.author || 'Anonymous'} that explores infinite possibilities...
                </p>
                <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                  <span className="flex items-center gap-1"><GitBranch size={14} className="text-indigo-400"/> {story.pathCount} Branches</span>
                  <span className="flex items-center gap-1"><Heart size={14} className="text-rose-400"/> {story.likeCount} Likes</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4">How It Works</p>
          <h2 className="text-4xl font-black tracking-tight">One story. Infinite paths.</h2>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-6"
        >
          {FEATURES.map(f => (
            <motion.div
              key={f.title}
              variants={item}
              className="glass rounded-3xl p-8 border-white/5 hover:border-indigo-500/20 transition-all group"
            >
              <div className={`${f.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                {f.icon}
              </div>
              <h3 className="text-xl font-black mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Story preview strip ──────────────────────────────────────── */}
      {stories.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 py-10 pb-24">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xs font-black text-slate-600 uppercase tracking-widest">Latest in the Archive</h2>
            <button onClick={() => navigate('/library')} className="text-xs font-black text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
              See All <ArrowRight size={12} />
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {stories.slice(0, 5).map(s => (
              <div
                key={s.id}
                onClick={() => navigate(`/story/${s.id}`)}
                className="glass border-white/5 hover:border-indigo-500/30 rounded-2xl p-6 min-w-[220px] cursor-pointer hover:-translate-y-1 transition-all shrink-0"
              >
                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">{s.metadata?.genre}</p>
                <p className="font-black text-sm mb-3 leading-tight">{s.title}</p>
                <div className="flex items-center gap-3 text-[9px] text-slate-600 font-bold">
                  <span className="flex items-center gap-1"><GitBranch size={9} /> {s.pathCount}</span>
                  <span className="flex items-center gap-1"><Heart size={9} /> {s.likeCount}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Footer CTA ───────────────────────────────────────────────── */}
      <section className="border-t border-white/5 py-32 text-center px-6 bg-gradient-to-b from-transparent to-indigo-950/10">
        <h2 className="text-5xl font-black tracking-tight mb-6">Ready to write your path?</h2>
        <p className="text-slate-500 mb-10 max-w-md mx-auto">Join the archive. Every word you add becomes part of a story that will outlast you.</p>
        <button
          onClick={() => navigate('/library')}
          className="bg-white text-slate-950 px-14 py-5 rounded-2xl text-base font-black shadow-2xl hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all"
        >
          JOIN THE LEGEND
        </button>
      </section>
    </div>
  );
};

export default LandingPage;
