import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { updateProfile, getAvatars, signOut } from '../store/authStore';
import { getUserStats } from '../store/dataStore';
import { useToast } from '../components/Toast';
import {
  PenLine, GitBranch, Heart, BookOpen, Star,
  Edit3, Check, X, LogOut, Sparkles, Clock
} from 'lucide-react';

const StatCard = ({ icon, label, value, color = 'text-indigo-400' }) => (
  <div className="glass rounded-2xl p-6 flex flex-col gap-2">
    <div className={`${color} mb-1`}>{icon}</div>
    <p className="text-2xl font-black text-white">{value}</p>
    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{label}</p>
  </div>
);

const ContributionGraph = ({ branches }) => {
  const days = 60;
  const now = Date.now();
  const data = Array.from({ length: days }).fill(0);
  
  branches.forEach(b => {
    const ageInDays = Math.floor((now - (b.timestamp || 0)) / 86400000);
    if (ageInDays < days && ageInDays >= 0) {
      data[days - 1 - ageInDays] += 1;
    }
  });

  return (
    <div className="glass rounded-2xl p-6 mb-10 border-white/5">
      <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-5 flex items-center gap-2">
        <GitBranch size={12} /> 60-Day Writing Streak
      </h2>
      <div className="flex flex-wrap gap-[3px]">
        {data.map((count, i) => {
          let color = "bg-slate-800/50";
          if (count === 1) color = "bg-indigo-500/30";
          else if (count === 2) color = "bg-indigo-500/60";
          else if (count > 2) color = "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]";
          
          return (
            <div 
              key={i} 
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[2px] sm:rounded-sm ${color} transition-all hover:scale-125 hover:z-10 cursor-help`}
              title={`${count} branches written`}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-3">
        <span>60 Days Ago</span>
        <span>Today</span>
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast    = useToast();
  const avatars  = getAvatars();

  const [editing, setEditing]     = useState(false);
  const [newName, setNewName]     = useState('');
  const [newAvatar, setNewAvatar] = useState('');
  const [stats, setStats]         = useState({ storiesCreated: [], branchesWritten: [], totalLikes: 0 });

  useEffect(() => {
    if (!user) return;
    setNewName(user.displayName || '');
    setNewAvatar(user.photoURL || user.avatar || '✨');
    
    // Fetch stats async
    getUserStats(user.uid).then(s => setStats(s));
  }, [user]);

  const handleSave = async () => {
    if (!newName.trim()) { toast.error('Name cannot be empty.'); return; }
    await updateProfile({ displayName: newName.trim(), avatar: newAvatar });
    toast.success('Profile updated!');
    setEditing(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (!user) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <p className="text-slate-500">Please sign in to view your profile.</p>
      <button onClick={() => navigate('/login')} className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors">
        Sign In →
      </button>
    </div>
  );

  const joinAge = Math.floor((Date.now() - (user.metadata?.createdAt || Date.now())) / 86400000) || 0;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 pb-32">
      {/* Hero card */}
      <div className="relative bg-gradient-to-br from-indigo-950/50 via-slate-900 to-slate-900 border border-indigo-500/20 rounded-[2.5rem] p-10 mb-10 overflow-hidden">
        {/* BG decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 opacity-5 pointer-events-none">
          <Sparkles size={256} />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-8">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-slate-800 border-2 border-indigo-500/30 flex items-center justify-center text-5xl shadow-2xl shadow-indigo-500/10">
              {user.photoURL || user.avatar || '✨'}
            </div>
            {!user.isAnonymous && (
              <div className="absolute -bottom-2 -right-2 bg-indigo-600 rounded-full p-1.5 shadow-lg">
                <Star size={10} className="text-white" fill="white" />
              </div>
            )}
          </div>

          {/* Name & meta */}
          {editing ? (
            <div className="flex-1 space-y-4">
              {/* Avatar picker */}
              <div className="flex gap-2 flex-wrap">
                {avatars.map(av => (
                  <button key={av} type="button" onClick={() => setNewAvatar(av)}
                    className={`text-2xl w-11 h-11 rounded-xl border-2 transition-all hover:scale-110
                      ${newAvatar === av ? 'border-indigo-500 bg-indigo-500/20 scale-110' : 'border-slate-700 bg-slate-800'}`}>
                    {av}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  maxLength={24}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-bold focus:outline-none focus:border-indigo-500/60 transition-all"
                />
                <button onClick={handleSave}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl transition-colors">
                  <Check size={18} />
                </button>
                <button onClick={() => setEditing(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-400 p-3 rounded-xl transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-black">{user.displayName || "Anonymous"}</h1>
                {user.isAnonymous && (
                  <span className="text-[9px] font-black bg-slate-800 text-slate-500 px-2 py-1 rounded uppercase tracking-widest">
                    Guest
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-sm mb-4 font-medium">{user.email || ''}</p>
              <div className="flex items-center gap-4 text-[10px] font-bold text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Clock size={10} />
                  {joinAge === 0 ? 'Joined today' : `${joinAge}d in the archive`}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          {!editing && (
            <div className="flex flex-col gap-2 shrink-0">
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 glass border-white/10 px-4 py-2.5 rounded-xl text-xs font-black text-slate-400 hover:text-white transition-colors"
              >
                <Edit3 size={13} /> Edit Profile
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 glass border-white/10 px-4 py-2.5 rounded-xl text-xs font-black text-red-400/70 hover:text-red-400 transition-colors"
              >
                <LogOut size={13} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        <StatCard icon={<BookOpen size={20} />} label="Stories Started"  value={stats.storiesCreated.length}  color="text-indigo-400" />
        <StatCard icon={<GitBranch size={20} />} label="Branches Written" value={stats.branchesWritten.length} color="text-purple-400" />
        <StatCard icon={<Heart size={20} />}     label="Total Likes"       value={stats.totalLikes}             color="text-rose-400"  />
      </div>

      {/* Contribution Heatmap */}
      {(stats.branchesWritten.length > 0 || stats.storiesCreated.length > 0) && (
        <ContributionGraph branches={stats.branchesWritten} />
      )}

      {/* Stories created */}
      {stats.storiesCreated.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-5 flex items-center gap-2">
            <BookOpen size={12} /> Legends You Started
          </h2>
          <div className="space-y-3">
            {stats.storiesCreated.map(story => (
              <div
                key={story.id}
                onClick={() => navigate(`/story/${story.id}`)}
                className="glass border-white/5 rounded-2xl px-6 py-4 flex justify-between items-center cursor-pointer hover:border-indigo-500/30 transition-all group"
              >
                <div>
                  <p className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors">{story.title}</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">{story.metadata?.genre} · {story.pathCount} paths</p>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-600">
                  <span className="flex items-center gap-1"><Heart size={10} className="text-rose-500/50" /> {story.likeCount || 0}</span>
                  <GitBranch size={13} className="text-indigo-500/40 group-hover:text-indigo-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Branches written */}
      {stats.branchesWritten.length > 0 && (
        <div>
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-5 flex items-center gap-2">
            <PenLine size={12} /> Branches You Wrote
          </h2>
          <div className="space-y-3">
            {stats.branchesWritten.slice(0, 8).map(node => (
              <div
                key={node.id}
                onClick={() => navigate(`/read/${node.storyId}/${node.id}`)}
                className="glass border-white/5 rounded-2xl px-6 py-4 cursor-pointer hover:border-indigo-500/30 transition-all group"
              >
                <p className="text-sm font-serif italic text-slate-400 group-hover:text-slate-200 transition-colors line-clamp-2">
                  "{node.text}"
                </p>
                <div className="flex items-center gap-3 mt-2 text-[9px] font-bold text-slate-700">
                  <span className="flex items-center gap-1"><Heart size={9} className="text-rose-500/40" /> {node.likeCount || 0}</span>
                  <span>·</span>
                  <span>{Math.floor((Date.now() - node.timestamp) / 86400000)}d ago</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {stats.storiesCreated.length === 0 && stats.branchesWritten.length === 0 && (
        <div className="text-center py-20 glass rounded-[2rem]">
          <p className="text-3xl mb-4">📖</p>
          <p className="text-slate-500 font-bold mb-6 italic">Your legend hasn't started yet.</p>
          <button
            onClick={() => navigate('/library')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all"
          >
            Explore the Archive
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
