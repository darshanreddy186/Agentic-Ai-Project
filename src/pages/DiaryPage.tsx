import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Sparkles } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { RichDiaryEditor } from "@/components/RichDiaryEditor";

// --- INTERFACES ---
interface DiaryEntryAnalysis {
  summary: string;
  mood: string;
}

interface DiaryEntry {
  id: string;
  text: string;
  timestamp: string;
  analysis?: DiaryEntryAnalysis;
}

// --- HELPER FUNCTION ---
const getTodayInIST = () => {
  const now = new Date();
  const istOffset = 330 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  istTime.setUTCHours(0, 0, 0, 0);
  return istTime;
};

const DiaryPage = () => {
  const [diaryHtml, setDiaryHtml] = useState("");
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(() => getTodayInIST());
  const [editMode, setEditMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchEntries();
  }, []);

  const selectedEntry = entries.find(e => {
    const entryDate = new Date(e.timestamp);
    return (
      entryDate.getFullYear() === selectedDate.getFullYear() &&
      entryDate.getMonth() === selectedDate.getMonth() &&
      entryDate.getDate() === selectedDate.getDate()
    );
  });

  useEffect(() => {
    if (selectedEntry) {
      setDiaryHtml(selectedEntry.text);
      setEditMode(false);
    } else {
      setDiaryHtml("<p></p>");
      setEditMode(true);
    }
  }, [selectedDate, entries]);

  const fetchEntries = async () => {
    try {
      // --- FIX: Updated mock data for better testing ---
      const mockEntries: DiaryEntry[] = [
        {
          id: '1',
          text: `<p>Yesterday was a really great day.</p><img src="https://plus.unsplash.com/premium_photo-1664474619075-644dd191935f?w=500"><p>I saw this beautiful scene on my walk.</p>`,
          timestamp: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(), // Yesterday
          analysis: { summary: "A productive and peaceful day.", mood: "Positive" }
        },
        {
          id: '2',
          text: `<p>A few days ago, I was feeling a bit creative and spent some time sketching.</p><img src="https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=500"><p>This was the result!</p>`,
          timestamp: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(), // 5 days ago
          analysis: { summary: "A day focused on creativity and art.", mood: "Neutral" }
        }
      ];
      setEntries(mockEntries);
    } catch (error) {
      console.error('Failed to fetch entries:', error);
      toast({ title: "Error", description: "Could not fetch diary entries.", variant: "destructive" });
    }
  };

  const handleSaveMemory = async (memory: { imageUrl: string; context: string; mood: string }) => {
    console.log("Saving memory to backend:", memory);
    // ... API call logic remains the same
  };

  const handleDeleteImage = async (imageUrl: string) => {
    if (imageUrl.startsWith('blob:')) return; // Don't delete unsaved images from backend
    toast({ title: "Deleting Image..." });
    try {
      const response = await fetch(`https://agenticairishi/api/diary/image`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId: selectedEntry?.id, imageUrl }),
      });
      if (!response.ok) throw new Error('Failed to delete image');
      toast({ title: "Image Deleted", description: "The image has been removed." });
    } catch (error) {
      console.error("Failed to delete image:", error);
      toast({ title: "Error", description: "Could not delete the image.", variant: "destructive" });
    }
  };

  const handleSaveEntry = async () => {
     if (!diaryHtml.trim() || diaryHtml === '<p></p>') {
      toast({ title: "Your diary is empty!", description: "Please write something before saving.", variant: "destructive" });
      return;
    }
    // ... Save logic remains the same
  };

  const formatDate = (timestamp: string | Date) => new Date(timestamp).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  const todayIST = getTodayInIST();
  const isFuture = selectedDate > todayIST;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent p-4 md:p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 order-2 lg:order-1">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-4xl flex justify-between items-center font-[Caveat,cursive]">
                <span>Dear Diary...</span>
                <span className="text-lg font-normal text-muted-foreground border-b-2 border-muted-foreground pb-1 px-4">
                  {formatDate(selectedDate)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isFuture && <div className="p-4 text-center text-destructive-foreground bg-destructive rounded-md">You cannot write about the future... yet!</div>}
              {!isFuture && (
                <RichDiaryEditor 
                  content={diaryHtml}
                  isEditable={editMode}
                  onChange={setDiaryHtml}
                  onSaveMemory={handleSaveMemory}
                  onDeleteImage={handleDeleteImage}
                />
              )}
              {!isFuture && (
                <div className="pt-4 flex gap-2">
                  {editMode ? (
                    <>
                      <Button onClick={handleSaveEntry} disabled={loading}>{loading ? "Saving..." : "Save Entry"}</Button>
                      {selectedEntry && (
                         <Button variant="outline" onClick={() => { setEditMode(false); setDiaryHtml(selectedEntry.text); }}>Cancel</Button>
                      )}
                    </>
                  ) : (
                    selectedEntry && <Button onClick={() => setEditMode(true)}>Edit Entry</Button>
                  )}
                </div>
              )}
              {selectedEntry && !editMode && selectedEntry.analysis && (
                 <Card className="mt-6 bg-muted/50"><CardHeader className="flex flex-row items-center space-x-3 pb-2"><Sparkles className="w-6 h-6 text-primary" /><CardTitle>AI-Powered Summary</CardTitle></CardHeader><CardContent><p className="text-muted-foreground italic">"{selectedEntry.analysis.summary}"</p></CardContent><CardFooter><Badge variant={selectedEntry.analysis.mood.toLowerCase() === 'positive' ? 'default' : 'destructive'}>Mood: {selectedEntry.analysis.mood}</Badge></CardFooter></Card>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1 order-1 lg:order-2 flex justify-center lg:justify-end">
          <div className="h-fit">
            <Calendar mode="single" selected={selectedDate} onSelect={date => date && setSelectedDate(date)} disabled={date => date > todayIST} className="rounded-md border shadow-lg bg-card" initialFocus />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiaryPage;