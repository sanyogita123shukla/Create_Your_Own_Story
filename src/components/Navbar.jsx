import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { signOut } from '../store/authStore';
import { Sparkles, BookOpen, LogIn, LogOut, User, Menu, X } from 'lucide-react';

const Navbar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const navLink = (to, label) => (
    <Link
      to={to}
      onClick={() => setMobileOpen(false)}
      className={`text-xs font-black uppercase tracking-widest transition-colors
        ${isActive(to) ? 'text-white' : 'text-slate-500 hover:text-slate-200'}`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-2 rounded-xl shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
            <Sparkles size={18} className="text-white" />
          </div>
          <span className="font-black tracking-tight hidden sm:block">
            Create_Your_Own<span className="text-indigo-400">_Story</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLink('/library', 'Library')}
          {user && navLink('/profile', 'Profile')}
        </div>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <Link to="/profile" className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-indigo-500/40 px-3 py-2 rounded-xl transition-all">
                <span className="text-xl leading-none">{user.avatar || '✨'}</span>
                <span className="text-sm font-bold text-slate-300 max-w-[100px] truncate">{user.displayName}</span>
              </Link>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-400 transition-colors"
              >
                <LogOut size={15} />
                <span className="hidden sm:block">Sign Out</span>
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 bg-white text-slate-950 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all shadow-xl shadow-white/5"
            >
              <LogIn size={15} />
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-slate-400 hover:text-white p-2"
          onClick={() => setMobileOpen(v => !v)}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-slate-950 border-t border-white/5 px-6 py-6 flex flex-col gap-5 animate-in slide-up">
          {navLink('/library', 'Library')}
          {user && navLink('/profile', 'Profile')}
          {user ? (
            <button
              onClick={() => { signOut(); setMobileOpen(false); }}
              className="flex items-center gap-2 text-xs font-bold text-red-400"
            >
              <LogOut size={15} /> Sign Out
            </button>
          ) : (
            <Link to="/login" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-xs font-black text-indigo-400">
              <LogIn size={15} /> Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
