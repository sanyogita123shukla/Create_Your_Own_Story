import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInGuest, updateProfile, getAvatars, signInWithGoogle } from '../store/authStore';
import { useAuth } from '../hooks/useAuth';
import { Sparkles, PenLine, ArrowRight } from 'lucide-react';
import { useToast } from '../components/Toast';

const LoginPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const toast = useToast();
  
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🌌');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const avatars = getAvatars();

  // Redirect if already logged in and not an anonymous guest without a name
  useEffect(() => {
    if (!loading && user && user.displayName !== 'Anonymous' && user.displayName) {
      navigate('/library');
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Please enter a pen name.'); return; }
    
    setIsAuthenticating(true);
    try {
      // First create anonymous user
      await signInGuest();
      // Then update their profile with chosen name and avatar
      await updateProfile({ displayName: name.trim(), avatar: selectedAvatar });
      
      toast.success(`Welcome, ${name.trim()}! Your legend begins.`);
      navigate('/library');
    } catch (error) {
      console.error(error);
      toast.error('Failed to sign in. Did you enable Anonymous Auth in Firebase?');
      setIsAuthenticating(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    try {
      await signInWithGoogle();
      toast.success('Successfully signed in with Google!');
      navigate('/library');
    } catch (error) {
      console.error(error);
      toast.error(`Failed to sign in with Google: ${error.message}`);
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] hero-glow flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 rounded-full text-indigo-400 text-xs font-black uppercase tracking-widest mb-6">
            <Sparkles size={12} />
            Join the Archive
          </div>
          <h1 className="text-4xl font-black mb-3 tracking-tight">
            Claim Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Pen Name</span>
          </h1>
          <p className="text-slate-500 text-sm">No password needed. Your stories define you.</p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-3xl p-8 space-y-8 shadow-2xl">
          {/* Avatar picker */}
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3">
              Choose Your Sigil
            </label>
            <div className="grid grid-cols-4 gap-3">
              {avatars.map(av => (
                <button
                  key={av}
                  type="button"
                  onClick={() => setSelectedAvatar(av)}
                  className={`text-3xl h-14 rounded-2xl border-2 transition-all hover:scale-110
                    ${selectedAvatar === av
                      ? 'border-indigo-500 bg-indigo-500/20 scale-110 shadow-lg shadow-indigo-500/20'
                      : 'border-slate-800 bg-slate-900 hover:border-slate-700'}`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          {/* Name input */}
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3">
              Your Pen Name
            </label>
            <div className="relative">
              <PenLine size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={24}
                placeholder="e.g. CosmicScribe, VoidPen..."
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-11 pr-4 py-4 text-white text-sm font-medium focus:outline-none focus:border-indigo-500/60 transition-all placeholder-slate-700"
                disabled={isAuthenticating}
              />
            </div>
            <p className="text-[10px] text-slate-600 mt-2 ml-1">{name.length}/24 characters</p>
          </div>

          {/* Preview */}
          {name && (
            <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 animate-in fade-in">
              <span className="text-2xl">{selectedAvatar}</span>
              <div>
                <p className="text-white font-bold text-sm">{name}</p>
                <p className="text-[10px] text-slate-600">{name.toLowerCase().replace(/\s+/g,'.')}@createyourownstory.io</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isAuthenticating}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-2xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
          >
            {isAuthenticating ? 'Claiming...' : 'Enter the Archive (Guest)'}
            <ArrowRight size={18} />
          </button>
          
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="flex-shrink-0 mx-4 text-slate-500 text-xs font-bold uppercase tracking-widest">or</span>
            <div className="flex-grow border-t border-slate-700"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isAuthenticating}
            className="w-full bg-white text-slate-900 hover:bg-slate-100 py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
          >
            Sign in with Google
          </button>
        </form>

        <p className="text-center text-xs text-slate-700 mt-6">
          Anonymous Auth will create a session saved in your browser.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
