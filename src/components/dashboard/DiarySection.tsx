import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase, DiaryEntry } from '../../lib/supabase';
import { RichDiaryEditor } from "./RichDiaryEditor";
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css'; // Import the library's styles
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

// --- INTERFACES & TYPES ---
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
const getToday = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to the start of the day
  return today;
};

// --- MAIN COMPONENT ---
export default function DiarySection({ diaryEntries, onNewEntry }: DiarySectionProps) {
  const { user } = useUser();
  const [diaryHtml, setDiaryHtml] = useState("<p></p>");
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(getToday());
  const [editMode, setEditMode] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const selectedEntry = diaryEntries.find(entry => {
    const entryDate = new Date(entry.created_at);
    return entryDate.toDateString() === selectedDate.toDateString();
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

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
    setIsCalendarOpen(false);
  };

  const handleSaveEntry = async () => {
    if (!user) return;
    if (!diaryHtml.trim() || diaryHtml === '<p></p>') {
      showNotification({ message: "Your diary is empty!", type: "error" });
      return;
    }
    setLoading(true);
    try {
      // We use toISOString() to store in UTC format in Supabase
      const entryData = { user_id: user.id, content: diaryHtml, mood_score: 0, created_at: selectedDate.toISOString() };
      const { error } = selectedEntry 
        ? await supabase.from('diary_entries').update({ content: entryData.content }).eq('id', selectedEntry.id)
        : await supabase.from('diary_entries').insert(entryData);

      if (error) throw error;
      showNotification({ message: "Entry Saved!", type: "success" });
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
    const { error } = await supabase.from('memories').insert({ user_id: user.id, diary_entry_id: selectedEntry.id, ...memory });
    if (error) showNotification({ message: "Could not save memory", description: error.message, type: "error" });
  };

  const handleDeleteImage = async (imageUrl: string) => {
    const fileName = imageUrl.split('/').pop();
    if (!fileName) return;
    await supabase.storage.from('diary_images').remove([fileName]);
    await supabase.from('memories').delete().eq('image_url', imageUrl);
    showNotification({ message: "Image and memory deleted!", type: 'success' });
  };

  const isFuture = selectedDate > getToday();

  return (
    <div className="relative min-h-screen bg-zinc-50 p-4 md:p-8">
      {/* --- Notification Popup --- */}
      {notification && (
        <div className={`fixed top-5 right-5 w-80 p-4 rounded-lg shadow-2xl text-white z-[100] ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          <p className="font-bold">{notification.message}</p>
          {notification.description && <p className="text-sm">{notification.description}</p>}
        </div>
      )}

      {/* --- Calendar Modal --- */}
      {isCalendarOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setIsCalendarOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-lg shadow-2xl">
             <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={{ after: getToday() }} // Can't select future dates
                initialFocus
                // Inline styles for a Google Calendar look
                styles={{
                    caption: { color: '#4f46e5', fontWeight: 'bold' },
                    head: { color: '#4f46e5' },
                }}
                modifiersClassNames={{
                    selected: 'bg-indigo-600 text-white hover:bg-indigo-700',
                    today: 'font-bold text-indigo-600',
                }}
             />
          </div>
        </div>
      )}

      {/* --- Main Diary Card (Now takes up more space) --- */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white border border-zinc-200 rounded-lg shadow-lg">
          <div className="p-6 flex justify-between items-center">
            <h1 className="text-4xl font-serif text-zinc-800">
              Dear Diary...
            </h1>
            <button 
              onClick={() => setIsCalendarOpen(true)}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-700"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span>{format(selectedDate, 'PPP')}</span> {/* e.g., Sep 12th, 2025 */}
            </button>
          </div>
          <div className="p-6 pt-0">
            {isFuture ? (
              <div className="p-4 text-center text-red-100 bg-red-600 rounded-md">You cannot write about the future... yet!</div>
            ) : (
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
    </div>
  );
};