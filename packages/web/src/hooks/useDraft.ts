import { useEffect, useRef, useCallback } from 'react';

const DRAFT_PREFIX = 'uniforum_draft_';

interface DraftData {
  title: string;
  content: string;
  boardId?: number;
  tags?: string[];
  savedAt: string;
}

export function useDraft(draftKey: string) {
  const key = `${DRAFT_PREFIX}${draftKey}`;

  const saveDraft = useCallback((title: string, content: string, boardId?: number, tags?: string[]) => {
    if (!title.trim() && !content.trim()) return;
    const data: DraftData = { title, content, boardId, tags, savedAt: new Date().toISOString() };
    localStorage.setItem(key, JSON.stringify(data));
  }, [key]);

  const loadDraft = useCallback((): DraftData | null => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as DraftData;
    } catch {
      return null;
    }
  }, [key]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(key);
  }, [key]);

  // 自动保存：每30秒保存一次
  const titleRef = useRef('');
  const contentRef = useRef('');
  const boardIdRef = useRef<number | undefined>();
  const tagsRef = useRef<string[]>([]);

  const updateRefs = (title: string, content: string, boardId?: number, tags?: string[]) => {
    titleRef.current = title;
    contentRef.current = content;
    boardIdRef.current = boardId;
    tagsRef.current = tags || [];
  };

  useEffect(() => {
    const timer = setInterval(() => {
      saveDraft(titleRef.current, contentRef.current, boardIdRef.current, tagsRef.current);
    }, 30000);
    return () => clearInterval(timer);
  }, [saveDraft]);

  return { saveDraft, loadDraft, clearDraft, updateRefs };
}
