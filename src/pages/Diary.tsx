import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase, DiaryEntry } from '../lib/supabase';
import { RichDiaryEditor } from "./RichDiaryEditor";
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";

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
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

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

  const selectedEntry = entries.find(entry => new Date(entry.created_at).toDateString() === selectedDate.toDateString());

  useEffect(() => {
    if (user) {
      loadEntries();
    }
  }, [user]);

  useEffect(() => {
    if (selectedEntry) {
      setDiaryHtml(selectedEntry.content);
      setEditMode(false);
    } else {
      setDiaryHtml("<p>What's on your mind today?</p>");
      setEditMode(true);
    }
  }, [selectedDate, entries]);

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
      setSelectedDate(new Date(date.setHours(0, 0, 0, 0)));
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

  // --- UPDATED: `handleSaveEntry` now generates and saves recommendations ---
  const handleSaveEntry = async () => {
    if (!user) return;
    const plainTextContent = diaryHtml.replace(/<[^>]*>?/gm, '').trim();
    if (plainTextContent.length < 15) {
      showNotification({ message: "Entry is too short", description: "Please write a bit more to save.", type: "error" });
      return;
    }
    setSaving(true);
    
    try {
      // Step 1: Save the primary Diary Entry
      const moodScore = await getMoodScore(diaryHtml);
      const entryData = { user_id: user.id, title: `Entry for ${format(selectedDate, 'PPP')}`, content: diaryHtml, mood_score: moodScore, tags: [], created_at: selectedDate.toISOString() };
      const { error: saveError } = selectedEntry 
          ? await supabase.from('diary_entries').update(entryData).eq('id', selectedEntry.id)
          : await supabase.from('diary_entries').insert(entryData);
      if (saveError) throw new Error(`Failed to save entry: ${saveError.message}`);

      // Step 2: Fetch the user's old AI summary
      const { data: summaryData } = await supabase.from('user_ai_summaries').select('diary_summary').eq('user_id', user.id).maybeSingle();
      const oldSummary = summaryData?.diary_summary || "This is the user's first diary entry.";

      // Step 3: Generate the NEW, updated summary
      const summaryPrompt = `You are an AI assistant that summarizes a user's diary entries over time. Update the previous summary by integrating the key feelings from the new entry. PREVIOUS SUMMARY: "${oldSummary}". NEW ENTRY: "${plainTextContent}". TASK: Respond with ONLY the updated summary text.`;
      const summaryResult = await model.generateContent(summaryPrompt);
      const updatedSummary = await summaryResult.response.text();

      // Step 4: Use the new summary to generate NEW recommendations
      const recsPrompt = `Based on this user summary, provide exactly 5 short, actionable wellness recommendations. Format as a numbered list. SUMMARY: "${updatedSummary}"`;
      const recsResult = await model.generateContent(recsPrompt);
      const recsText = await recsResult.response.text();
      const parsedRecommendations = recsText.split('\n').map(rec => rec.replace(/^\d+\.\s*/, '').trim()).filter(rec => rec.length > 5);

      // Step 5: Save BOTH the new summary and new recommendations to the database
      const { error: upsertError } = await supabase.from('user_ai_summaries').upsert({ 
          user_id: user.id, 
          diary_summary: updatedSummary.trim(),
          recommendations: parsedRecommendations.slice(0, 5), // Ensure it's an array of 5
          updated_at: new Date().toISOString() 
        }, { onConflict: 'user_id' });
      
      if (upsertError) throw new Error(`Could not update AI data: ${upsertError.message}`);
      
      showNotification({ message: "Entry Saved & Analyzed!", type: "success" });
      setEditMode(false);
      await loadEntries();

    } catch (error: any) {
      showNotification({ message: "An Error Occurred", description: error.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMemory = async (memory: { imageUrl: string; context: string; mood: string }) => {
    if (!user || !selectedEntry) return;
    const { error } = await supabase.from('memories').insert({ user_id: user.id, diary_entry_id: selectedEntry.id, ...memory });
    if (error) showNotification({ message: "Could not save memory", description: error.message, type: "error" });
  };

  const isFuture = selectedDate > getToday();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white p-4 md:p-8">
      {notification && (
        <div className={`fixed top-5 right-5 w-80 p-4 rounded-lg shadow-2xl text-white z-[100] ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          <p className="font-bold">{notification.message}</p>
          {notification.description && <p className="text-sm">{notification.description}</p>}
        </div>
      )}
      {isCalendarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setIsCalendarOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-lg shadow-2xl">
            <DayPicker mode="single" selected={selectedDate} onSelect={handleDateSelect} disabled={{ after: getToday() }} initialFocus styles={{ caption: { color: '#4f46e5', fontWeight: 'bold' }, head: { color: '#4f46e5' } }} modifiersClassNames={{ selected: 'bg-indigo-600 text-white hover:bg-indigo-700', today: 'font-bold text-indigo-600' }}/>
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white border border-zinc-200 rounded-lg shadow-lg">
          <div className="p-6 flex justify-between items-center">
            <h1 className="text-4xl font-serif text-zinc-800">Dear Diary...</h1>
            <button onClick={() => setIsCalendarOpen(true)} className="inline-flex items-center justify-center h-10 px-4 py-2 text-sm font-medium bg-white border rounded-md hover:bg-zinc-100 text-zinc-700">
              <CalendarIcon className="w-4 h-4 mr-2" />
              <span>{format(selectedDate, 'PPP')}</span>
            </button>
          </div>
          <div className="p-6 pt-0">
            {isFuture ? (
              <div className="p-4 text-center text-red-100 bg-red-600 rounded-md">You cannot write about the future... yet!</div>
            ) : (
              <RichDiaryEditor content={diaryHtml} isEditable={editMode} onChange={setDiaryHtml} onSaveMemory={handleSaveMemory} showNotification={showNotification} />
            )}
            {!isFuture && (
              <div className="pt-4 flex gap-2">
                {editMode ? (
                  <>
                    <button onClick={handleSaveEntry} disabled={saving} className="inline-flex items-center justify-center h-10 px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-md hover:bg-zinc-800 disabled:opacity-50">
                      {saving ? "Analyzing & Saving..." : "Save Entry"}
                    </button>
                    {selectedEntry && (<button onClick={() => { setEditMode(false); setDiaryHtml(selectedEntry.content); }} className="inline-flex items-center justify-center h-10 px-4 py-2 text-sm font-medium bg-transparent border rounded-md hover:bg-zinc-100">Cancel</button>)}
                  </>
                ) : (
                  selectedEntry && <button onClick={() => setEditMode(true)} className="inline-flex items-center justify-center h-10 px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-md hover:bg-zinc-800">Edit Entry</button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}