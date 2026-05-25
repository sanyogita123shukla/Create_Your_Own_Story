import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import { ToastProvider } from './components/Toast';
import './App.css';

const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const LibraryPage = React.lazy(() => import('./pages/LibraryPage'));
const StoryCanvas = React.lazy(() => import('./pages/StoryCanvas'));
const Workspace = React.lazy(() => import('./pages/Workspace'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const ReaderPage = React.lazy(() => import('./pages/ReaderPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));

const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
    <div className="relative w-14 h-14">
      <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
      <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin" />
    </div>
    <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.25em] animate-pulse">
      Loading Archive…
    </p>
  </div>
);

function App() {
  return (
    <ToastProvider>
      <Router>
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
          <Navbar />
          <main>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/"                        element={<LandingPage />} />
                <Route path="/library"                 element={<LibraryPage />} />
                <Route path="/story/:id"               element={<StoryCanvas />} />
                <Route path="/read/:storyId/:nodeId"   element={<ReaderPage />} />
                <Route path="/write/:nodeId"           element={<Workspace />} />
                <Route path="/profile"                 element={<ProfilePage />} />
                <Route path="/login"                   element={<LoginPage />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;
