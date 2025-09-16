// src/pages/Diary.tsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase, DiaryEntry } from '../lib/supabase';
import { RichDiaryEditor, Memory } from "./RichDiaryEditor";
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Edit, X } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";
// Import the premium CSS styles
import './Dairy.css';

// --- INTERFACES & TYPES ---
interface Notification {
  message: string;
  description?: string;
  type: 'success' | 'error';
}

// --- HELPER FUNCTIONS ---
const getToday = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

// --- INITIALIZE GEMINI MODEL ---
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY; 
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// --- MAIN COMPONENT ---
export function Diary() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [diaryHtml, setDiaryHtml] = useState("<p></p>");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(getToday());
  const [editMode, setEditMode] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [memoryQueue, setMemoryQueue] = useState<Memory[]>([]);

  const getDraftKey = useCallback(() => {
    if (!user) return null;
    return `diary-draft-${user.id}-${format(selectedDate, 'yyyy-MM-dd')}`;
  }, [user, selectedDate]);

  const selectedEntry = entries.find(entry => {
    const entryDate = new Date(entry.created_at);
    entryDate.setHours(0,0,0,0);
    return entryDate.getTime() === selectedDate.getTime();
  });

  useEffect(() => {
    if (user) {
      loadEntries();
    }
  }, [user]);
  
  useEffect(() => {
    const draftKey = getDraftKey();
    
    const timer = setTimeout(() => {
        if (selectedEntry) {
            setDiaryHtml(selectedEntry.content);
            setEditMode(false);
            setMemoryQueue([]);
        } else {
            const savedDraft = draftKey ? localStorage.getItem(draftKey) : null;
            setDiaryHtml(savedDraft || "<p>What's on your mind today?</p>");
            setEditMode(true);
            setMemoryQueue([]);
        }
    }, 0);

    return () => clearTimeout(timer);
  }, [selectedDate, entries, user]);

  const loadEntries = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('diary_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      setEntries(data || []);
    } catch (error: any) {
      showNotification({ message: "Error loading entries", description: error.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (notif: Notification) => {
    setNotification(notif);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const newDate = new Date(date);
      newDate.setHours(0,0,0,0);
      setSelectedDate(newDate);
    }
    setIsCalendarOpen(false);
  };

  const getMoodScore = async (content: string): Promise<number> => {
    const plainText = content.replace(/<[^>]*>?/gm, '').trim();
    if (plainText.length < 15) return 5;
    const prompt = `On a scale of 1 (very negative) to 10 (very positive), analyze the sentiment of this diary entry. Respond with only a number. Entry: "${plainText}"`;
    try {
      const result = await model.generateContent(prompt);
      const text = await result.response.text();
      const score = parseInt(text.trim(), 10);
      return isNaN(score) ? 5 : Math.max(1, Math.min(10, score));
    } catch (error) {
      console.error("Error getting mood score:", error);
      return 5;
    }
  };

  const handleSaveEntry = async () => {
    if (!user) return;
    const plainTextContent = diaryHtml.replace(/<[^>]*>?/gm, '').trim();
    if (plainTextContent.length < 15) {
      showNotification({ message: "Entry is too short", description: "Please write a bit more to save.", type: "error" });
      return;
    }
    setSaving(true);
    
    try {
      const moodScore = await getMoodScore(diaryHtml);
      const entryData = { 
          user_id: user.id, 
          title: `Entry for ${format(selectedDate, 'PPP')}`, 
          content: diaryHtml, 
          mood_score: moodScore, 
          created_at: selectedDate.toISOString() 
      };
      
      let savedEntryId: string;

      if (selectedEntry) {
        const { data, error } = await supabase.from('diary_entries').update(entryData).eq('id', selectedEntry.id).select('id').single();
        if (error) throw new Error(`Failed to update entry: ${error.message}`);
        savedEntryId = data.id;
      } else {
        const { data, error } = await supabase.from('diary_entries').insert(entryData).select('id').single();
        if (error) throw new Error(`Failed to insert entry: ${error.message}`);
        savedEntryId = data.id;
      }

      if (memoryQueue.length > 0) {
        const memoriesToInsert = memoryQueue.map(mem => ({ ...mem, user_id: user.id, diary_entry_id: savedEntryId }));
        const { error: memoryError } = await supabase.from('memories').insert(memoriesToInsert);
        if (memoryError) showNotification({ message: "Entry saved, but failed to save memories", description: memoryError.message, type: "error" });
      }

      const { data: summaryData } = await supabase.from('user_ai_summaries').select('diary_summary').eq('user_id', user.id).maybeSingle();
      const oldSummary = summaryData?.diary_summary || "This is the user's first diary entry.";
      const summaryPrompt = `Update the previous summary by integrating the key feelings from the new entry. PREVIOUS SUMMARY: "${oldSummary}". NEW ENTRY: "${plainTextContent}". TASK: Respond with ONLY the updated summary text.`;
      const summaryResult = await model.generateContent(summaryPrompt);
      const updatedSummary = await summaryResult.response.text();
      const recsPrompt = `Based on this user summary, provide exactly 5 short, actionable wellness recommendations. Format as a numbered list. SUMMARY: "${updatedSummary}"`;
      const recsResult = await model.generateContent(recsPrompt);
      const recsText = await recsResult.response.text();
      const parsedRecommendations = recsText.split('\n').map(rec => rec.replace(/^\d+\.\s*/, '').trim()).filter(rec => rec.length > 5);
      const { error: upsertError } = await supabase.from('user_ai_summaries').upsert({ user_id: user.id, diary_summary: updatedSummary.trim(), recommendations: parsedRecommendations.slice(0, 5), updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      if (upsertError) throw new Error(`Could not update AI data: ${upsertError.message}`);
      
      const draftKey = getDraftKey();
      if (draftKey) {
        localStorage.removeItem(draftKey);
      }
      
      showNotification({ message: "Entry Saved & Analyzed!", type: "success" });
      setEditMode(false);
      setMemoryQueue([]);
      await loadEntries();

    } catch (error: any) {
      showNotification({ message: "An Error Occurred", description: error.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMemory = async (memory: Memory) => {
    setMemoryQueue(prevQueue => [...prevQueue, memory]);
    showNotification({ message: "Memory added", description: "It will be saved with your entry.", type: "success" });
  };
  
  const handleContentChange = (newContent: string) => {
    setDiaryHtml(newContent);
    const draftKey = getDraftKey();
    if (draftKey && (editMode || !selectedEntry)) {
      localStorage.setItem(draftKey, newContent);
    }
  };

  const isFuture = selectedDate > getToday();

  if (loading) {
    return (
      <div className="premium-loading-container">
        <div className="premium-loader">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent"></div>
          <div className="loading-pulse"></div>
        </div>
        <p className="loading-text">Loading your magical diary...</p>
        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    );
  }

  return (
    <div className="diary-container">
      {/* Floating Background Elements */}
      <div className="floating-elements">
        <div className="floating-circle floating-circle-1"></div>
        <div className="floating-circle floating-circle-2"></div>
        <div className="floating-circle floating-circle-3"></div>
      </div>

      {/* Premium Notification */}
      {notification && (
        <div className={`premium-notification ${notification.type === 'success' ? 'notification-success' : 'notification-error'}`}>
          <div className="notification-content">
            <div className="notification-icon">
              {notification.type === 'success' ? '✨' : '⚠️'}
            </div>
            <div>
              <p className="notification-title">{notification.message}</p>
              {notification.description && (
                <p className="notification-description">{notification.description}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Calendar Overlay */}
      {isCalendarOpen && (
        <div className="calendar-overlay" onClick={() => setIsCalendarOpen(false)}>
          <div className="calendar-container" onClick={(e) => e.stopPropagation()}>
            <div className="calendar-header">
              <h3>Choose Your Date</h3>
              <button 
                className="calendar-close"
                onClick={() => setIsCalendarOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <DayPicker 
              mode="single" 
              selected={selectedDate} 
              onSelect={handleDateSelect} 
              disabled={{ after: getToday() }} 
              initialFocus 
              className="premium-calendar"
            />
          </div>
        </div>
      )}

      <div className="diary-content">
        <div className="diary-card">
          {/* Enhanced Header */}
          <div className="diary-header">
            <div className="header-content">
              <h1 className="diary-title">
                <div className="title-left">
                  <span className="title-emoji">📖</span>
                  Dear Diary...
                  <span className="title-sparkle">✨</span>
                </div>

                <button 
                  onClick={() => setIsCalendarOpen(true)} 
                  className="date-selector"
                >
                  <CalendarIcon className="w-5 h-5" />
                  <div className="date-text" style={{color:"black"}}>{format(selectedDate, 'PPP')}</div>
                  <div className="date-indicator"></div>
                </button>
              </h1>
            </div>
          </div>

          {/* Enhanced Content Area */}
          <div className="diary-body">
            {isFuture ? (
              <div className="future-warning">
                <div className="warning-icon">⏰</div>
                <div className="warning-content">
                  <h3>Time Travel Not Available!</h3>
                  <p>You cannot write about the future... yet! ✨</p>
                </div>
                <div className="warning-decoration"></div>
              </div>
            ) : (
              <div className="editor-container">
                <RichDiaryEditor 
                  content={diaryHtml} 
                  isEditable={editMode} 
                  onChange={handleContentChange} 
                  onSaveMemory={handleSaveMemory} 
                  showNotification={showNotification} 
                />
              </div>
            )}

            {/* Enhanced Action Buttons */}
            {!isFuture && (
              <div className="action-buttons">
                {editMode ? (
                  <>
                    <button 
                      onClick={handleSaveEntry} 
                      disabled={saving} 
                      className="btn-primary"
                    >
                      <span className="btn-icon">
                        {saving ? '⚡' : '💾'}
                      </span>
                      <span className="btn-text">
                        {saving ? "Analyzing & Saving..." : "Save Entry"}
                      </span>
                      <div className="btn-ripple"></div>
                    </button>
                    {selectedEntry && (
                      <button 
                        onClick={() => { 
                          setEditMode(false); 
                          setDiaryHtml(selectedEntry.content); 
                        }} 
                        className="btn-secondary"
                      >
                        <X className="w-4 h-4" />
                        <span>Cancel</span>
                      </button>
                    )}
                  </>
                ) : (
                  selectedEntry && (
                    <button 
                      onClick={() => setEditMode(true)} 
                      className="btn-primary"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit Entry</span>
                      <div className="btn-shine"></div>
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}