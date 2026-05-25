import { db } from '../config/firebase';
import { ref, get, set, push, onValue, runTransaction, query, orderByChild, equalTo, limitToLast, orderByKey, endBefore } from 'firebase/database';
import { useState, useEffect } from 'react';

// Hooks for React components
export const useStories = () => {
  const [stories, setStories] = useState([]);
  useEffect(() => {
    if (!db) return;
    const storiesRef = query(ref(db, 'stories'), limitToLast(100));
    const unsubscribe = onValue(storiesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setStories(Object.values(data));
      } else {
        setStories([]);
      }
    });
    return () => unsubscribe();
  }, []);
  return stories;
};

// ENTERPRISE OPTIMIZATION: True Cursor-Based Pagination
export const usePaginatedStories = (pageSize = 12) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [firstKey, setFirstKey] = useState(null); // The oldest key seen

  useEffect(() => {
    if (!db) return;
    const fetchInitial = async () => {
      setLoading(true);
      const q = query(ref(db, 'stories'), orderByKey(), limitToLast(pageSize));
      const snap = await get(q);
      const data = snap.val();
      if (data) {
        const arr = Object.values(data);
        const keys = Object.keys(data);
        setFirstKey(keys[0]); // Lowest key = oldest in batch
        setStories(arr.reverse()); // Reverse to show newest first
        setHasMore(arr.length === pageSize);
      } else {
        setHasMore(false);
      }
      setLoading(false);
    };
    fetchInitial();
  }, [pageSize]);

  const loadMore = async () => {
    if (!db || loading || !hasMore || !firstKey) return;
    setLoading(true);
    // Fetch next batch ending BEFORE the oldest key we have
    const q = query(ref(db, 'stories'), orderByKey(), endBefore(firstKey), limitToLast(pageSize));
    const snap = await get(q);
    const data = snap.val();
    if (data) {
      const arr = Object.values(data);
      const keys = Object.keys(data);
      setFirstKey(keys[0]);
      setStories(prev => [...prev, ...arr.reverse()]);
      setHasMore(arr.length === pageSize);
    } else {
      setHasMore(false);
    }
    setLoading(false);
  };

  return { stories, loading, hasMore, loadMore };
};

export const useNodesForStory = (storyId) => {
  const [nodes, setNodes] = useState([]);
  useEffect(() => {
    if (!db || !storyId) return;
    const nodesQuery = query(ref(db, 'nodes'), orderByChild('storyId'), equalTo(storyId));
    const unsubscribe = onValue(nodesQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setNodes(Object.values(data));
      } else {
        setNodes([]);
      }
    });
    return () => unsubscribe();
  }, [storyId]);
  return nodes;
};

// Async functions for actions
export const getStory = async (id) => {
  if (!db) return null;
  const snapshot = await get(ref(db, `stories/${id}`));
  return snapshot.exists() ? snapshot.val() : null;
};

export const getNode = async (id) => {
  if (!db) return null;
  const snapshot = await get(ref(db, `nodes/${id}`));
  return snapshot.exists() ? snapshot.val() : null;
};

export const createStory = async ({ title, genre, firstSentence, author, authorId }) => {
  if (!db) throw new Error("Firebase not configured");
  
  const storyRef = push(ref(db, 'stories'));
  const storyId = storyRef.key;
  const nodeRef = push(ref(db, 'nodes'));
  const nodeId = nodeRef.key;

  const storyData = {
    id: storyId, title, rootNodeId: nodeId, pathCount: 1, likeCount: 0,
    metadata: { author, authorId, genre, createdAt: Date.now() },
  };

  const nodeData = {
    id: nodeId, text: firstSentence, authorId, authorName: author,
    storyId, parentId: null, isRoot: true, children: [], likeCount: 0, timestamp: Date.now(),
  };

  await set(storyRef, storyData);
  await set(nodeRef, nodeData);

  return { storyId, nodeId };
};

export const createNode = async ({ text, authorId, authorName, parentId, storyId }) => {
  if (!db) throw new Error("Firebase not configured");
  
  const nodeRef = push(ref(db, 'nodes'));
  const nodeId = nodeRef.key;
  
  const nodeData = {
    id: nodeId, text, authorId, authorName, parentId, storyId, children: [], likeCount: 0, timestamp: Date.now()
  };

  await set(nodeRef, nodeData);

  if (parentId) {
    const parentChildrenRef = ref(db, `nodes/${parentId}/children`);
    await runTransaction(parentChildrenRef, (children) => {
      return [...(children || []), nodeId];
    });
  }

  const storyPathCountRef = ref(db, `stories/${storyId}/pathCount`);
  await runTransaction(storyPathCountRef, (count) => (count || 0) + 1);

  return nodeId;
};

export const toggleNodeLike = async (nodeId, userId) => {
  if (!db) return false;
  
  const likeRef = ref(db, `likes/${userId}_${nodeId}`);
  let liked = false;
  
  await runTransaction(likeRef, (currentData) => {
    if (currentData === null) {
      liked = true;
      return true;
    } else {
      liked = false;
      return null;
    }
  });

  const nodeLikeCountRef = ref(db, `nodes/${nodeId}/likeCount`);
  await runTransaction(nodeLikeCountRef, (count) => Math.max(0, (count || 0) + (liked ? 1 : -1)));
  
  const nodeSnapshot = await get(ref(db, `nodes/${nodeId}/storyId`));
  const storyId = nodeSnapshot.val();
  if (storyId) {
     const storyLikeCountRef = ref(db, `stories/${storyId}/likeCount`);
     await runTransaction(storyLikeCountRef, (count) => Math.max(0, (count || 0) + (liked ? 1 : -1)));
  }

  return liked;
};

export const isNodeLiked = async (nodeId, userId) => {
  if (!db) return false;
  const snapshot = await get(ref(db, `likes/${userId}_${nodeId}`));
  return snapshot.exists();
};

export const getAncestryPath = async (nodeId) => {
  const path = [];
  let currentId = nodeId;
  let guard = 0;
  while (currentId && guard++ < 20) {
    const n = await getNode(currentId);
    if (!n) break;
    path.unshift(n);
    currentId = n.parentId;
  }
  return path;
};

export const getUserStats = async (userId) => {
  if (!db) return { storiesCreated: [], branchesWritten: [], totalLikes: 0 };
  
  // This is a naive implementation. For a real production app, 
  // you would want server-side indexing or cloud functions for this.
  const storiesSnapshot = await get(query(ref(db, 'stories'), orderByChild('metadata/authorId'), equalTo(userId)));
  const nodesSnapshot = await get(query(ref(db, 'nodes'), orderByChild('authorId'), equalTo(userId)));
  
  const storiesCreated = storiesSnapshot.exists() ? Object.values(storiesSnapshot.val()) : [];
  const nodes = nodesSnapshot.exists() ? Object.values(nodesSnapshot.val()) : [];
  
  const branchesWritten = nodes.filter(n => !n.isRoot);
  const totalLikes = nodes.reduce((acc, n) => acc + (n.likeCount || 0), 0);
  
  return { storiesCreated, branchesWritten, totalLikes };
};
