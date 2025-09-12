import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase, DiaryEntry } from '../../lib/supabase';
import { RichDiaryEditor } from "./RichDiaryEditor";

// --- INTERFACES ---
interface DiarySectionProps {
  diaryEntries: DiaryEntry[];
  onNewEntry: () => void;
  onAchievementUnlocked: () => void;
}

interface Notification {
  message: string;
  description?: string;
  type: 'success' | 'error';
}

// --- HELPER FUNCTIONS ---
const getTodayInIST = () => {
  const now = new Date();
  const istOffset = 330 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  istTime.setUTCHours(0, 0, 0, 0);
  return istTime;
};

const dateToInputString = (date: Date): string => date.toISOString().split('T')[0];
const inputStringToDate = (dateString: string): Date => new Date(`${dateString}T00:00:00`);

// --- COMPONENT ---
export default function DiarySection({ diaryEntries, onNewEntry }: DiarySectionProps) {
  const { user } = useUser();
  const [diaryHtml, setDiaryHtml] = useState("<p></p>");
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(() => getTodayInIST());
  const [editMode, setEditMode] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);

  const selectedEntry = diaryEntries.find(entry => {
    const entryDate = new Date(entry.created_at);
    return entryDate.toISOString().split('T')[0] === selectedDate.toISOString().split('T')[0];
  });

  useEffect(() => {
    if (selectedEntry) {
      setDiaryHtml(selectedEntry.content);
      setEditMode(false);
    } else {
      setDiaryHtml("<p></p>");
      setEditMode(true); 
    }
  }, [selectedDate, selectedEntry]);

  const showNotification = (notif: Notification) => {
    setNotification(notif);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSaveEntry = async () => {
    if (!user) return;
    if (!diaryHtml.trim() || diaryHtml === '<p></p>') {
      showNotification({ message: "Your diary is empty!", description: "Please write something before saving.", type: "error" });
      return;
    }
    setLoading(true);
    try {
      const entryData = { user_id: user.id, content: diaryHtml, mood_score: 0, created_at: selectedDate.toISOString() };
      const { error } = selectedEntry 
        ? await supabase.from('diary_entries').update({ content: entryData.content }).eq('id', selectedEntry.id)
        : await supabase.from('diary_entries').insert(entryData);

      if (error) throw error;

      showNotification({ message: "Entry Saved!", description: "Your thoughts have been recorded.", type: "success" });
      setEditMode(false);
      onNewEntry(); 
    } catch (error: any) {
      showNotification({ message: "Error saving entry", description: error.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveMemory = async (memory: { imageUrl: string; context: string; mood: string }) => {
    if (!user || !selectedEntry) {
      showNotification({ message: "Error", description: "An entry must be saved before adding memories.", type: "error" });
      return;
    }
    const { error } = await supabase.from('memories').insert({
      user_id: user.id,
      diary_entry_id: selectedEntry.id,
      image_url: memory.imageUrl,
      context: memory.context,
      mood: memory.mood,
    });
    if (error) {
      showNotification({ message: "Could not save memory", description: error.message, type: "error" });
    }
  };

  const handleDeleteImage = async (imageUrl: string) => {
    const fileName = imageUrl.split('/').pop();
    if (!fileName) return;
    const { error: storageError } = await supabase.storage.from('diary_images').remove([fileName]);
    if (storageError) {
      showNotification({ message: "Could not delete image file", description: storageError.message, type: "error" });
      return;
    }
    await supabase.from('memories').delete().eq('image_url', imageUrl);
    showNotification({ message: "Image and memory deleted!", type: 'success' });
  };

  const formatDate = (timestamp: string | Date) => new Date(timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const todayIST = getTodayInIST();
  const isFuture = selectedDate > todayIST;

  return (
    <div className="relative min-h-screen bg-white p-4 md:p-8">
      {notification && (
        <div className={`fixed top-5 right-5 w-80 p-4 rounded-md shadow-lg text-white z-50 ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          <p className="font-bold">{notification.message}</p>
          {notification.description && <p className="text-sm">{notification.description}</p>}
        </div>
      )}

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 order-2 lg:order-1">
          <div className="bg-white border border-zinc-200 rounded-lg shadow-lg">
            <div className="p-6">
              <div className="text-4xl flex justify-between items-center font-serif text-zinc-800">
                <span>Dear Diary...</span>
                <span className="text-lg font-normal text-zinc-500">
                  {formatDate(selectedDate)}
                </span>
              </div>
            </div>
            <div className="p-6 pt-0">
              {isFuture ? <div className="p-4 text-center text-red-100 bg-red-600 rounded-md">You cannot write about the future... yet!</div> : (
                <RichDiaryEditor 
                  content={diaryHtml}
                  isEditable={editMode}
                  onChange={setDiaryHtml}
                  onSaveMemory={handleSaveMemory}
                  onDeleteImage={handleDeleteImage}
                  showNotification={showNotification}
                />
              )}
              {!isFuture && (
                <div className="pt-4 flex gap-2">
                  {editMode ? (
                    <>
                      <button onClick={handleSaveEntry} disabled={loading} className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 disabled:opacity-50">
                        {loading ? "Saving..." : "Save Entry"}
                      </button>
                      {selectedEntry && (
                         <button onClick={() => { setEditMode(false); setDiaryHtml(selectedEntry.content); }} className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-zinc-200 bg-transparent h-10 px-4 py-2 hover:bg-zinc-100">Cancel</button>
                      )}
                    </>
                  ) : (
                    selectedEntry && <button onClick={() => setEditMode(true)} className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90">Edit Entry</button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1 order-1 lg:order-2 flex justify-center lg:justify-start">
          <div className="h-fit p-3 bg-white border border-zinc-200 rounded-md shadow-lg">
            <input 
              type="date"
              value={dateToInputString(selectedDate)}
              onChange={(e) => setSelectedDate(inputStringToDate(e.target.value))}
              max={dateToInputString(todayIST)}
              className="w-full p-2 border border-zinc-300 rounded-md bg-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
};