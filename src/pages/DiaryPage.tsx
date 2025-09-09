import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Upload, Calendar as CalendarIcon, X, Sparkles, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";

// --- INTERFACES ---
interface DiaryEntryAnalysis {
  summary: string;
  mood: string;
}

interface DiaryEntry {
  id: string;
  text: string;
  imageUrls?: string[];
  timestamp: string;
  analysis?: DiaryEntryAnalysis;
}

// --- TYPE for Auto-Save Status ---
type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// --- HELPER FUNCTIONS ---
const getTodayInIST = () => {
  const now = new Date();
  const istOffset = 330 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  istTime.setUTCHours(0, 0, 0, 0);
  return istTime;
};

// --- COMPONENT ---
const DiaryPage = () => {
  // --- STATE MANAGEMENT ---
  const [entryText, setEntryText] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]); // For new uploads
  const [editableImageUrls, setEditableImageUrls] = useState<string[]>([]); // For existing images in edit mode
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(false); // For manual save button
  const [selectedDate, setSelectedDate] = useState<Date>(() => getTodayInIST());
  const [editMode, setEditMode] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle');
  const { toast } = useToast();

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- DATA FETCHING & SYNC ---
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
  
  // Effect to update form state when selected entry or date changes
  useEffect(() => {
    if (selectedEntry) {
      setEntryText(selectedEntry.text);
      setImageFiles([]);
      // When entering view mode, clear editable URLs
      setEditableImageUrls([]);
      setEditMode(false);
    } else {
      setEntryText("");
      setImageFiles([]);
      setEditableImageUrls([]);
      setEditMode(false);
    }
  }, [selectedDate, entries]);

  const fetchEntries = async () => {
    try {
      // MOCK DATA: Replace with your API call.
      const mockEntries: DiaryEntry[] = [
        { id: '1', text: 'Yesterday was a really great day. I finished a major project at work and received positive feedback. In the evening, I went for a long walk and felt very peaceful.', timestamp: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(), imageUrls: ['https://plus.unsplash.com/premium_photo-1664474619075-644dd191935f?w=500', 'https://img.freepik.com/free-photo/closeup-scarlet-macaw-from-side-view-scarlet-macaw-closeup-head_488145-3540.jpg?w=740'], analysis: { summary: "A productive and peaceful day marked by professional achievement and relaxing personal time.", mood: "Positive" } },
        { id: '2', text: 'Five days ago, the weather was gloomy, and I felt a bit down. I spent the day reading and listening to music, which helped lift my spirits a little.', timestamp: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(), imageUrls: ['https://images.unsplash.com/photo-1497169190325-c2abbe00c1a1?w=500'], analysis: { summary: "A gloomy day where introspective activities like reading and music provided some comfort.", mood: "Neutral" } },
        { id: '3', text: 'Five days ago, the weather was gloomy, and I felt a bit down. I spent the day reading and listening to music, which helped lift my spirits a little.', timestamp: new Date(new Date().setDate(new Date().getDate())).toISOString(), imageUrls: ['https://images.unsplash.com/photo-1497169190325-c2abbe00c1a1?w=500'], analysis: { summary: "A gloomy day where introspective activities like reading and music provided some comfort.", mood: "Good" } }
      ];
      setEntries(mockEntries);
    } catch (error) {
      console.error('Failed to fetch entries:', error);
      toast({ title: "Error", description: "Could not fetch diary entries.", variant: "destructive" });
    }
  };

  // --- AUTO-SAVE LOGIC ---
  const handleAutoSave = useCallback(async (textToSave: string) => {
    if (!selectedEntry) return;

    setAutoSaveStatus('saving');
    try {
      // API call for auto-saving. This should be a lightweight endpoint.
      const response = await fetch(`https://agenticairishi/api/diary/autosave`, {
        method: 'PATCH', // PATCH is ideal for partial updates
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedEntry.id, text: textToSave }),
      });

      if (!response.ok) throw new Error('Auto-save failed');

      // Update local state to reflect the saved text
      setEntries(prevEntries => prevEntries.map(entry =>
        entry.id === selectedEntry.id ? { ...entry, text: textToSave } : entry
      ));
      setAutoSaveStatus('saved');
    } catch (error) {
      console.error('Auto-save error:', error);
      setAutoSaveStatus('error');
    }
  }, [selectedEntry]);

  // Effect to trigger auto-save on text change
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    // Only auto-save if in edit mode and text has changed
    if (editMode && selectedEntry && entryText !== selectedEntry.text) {
      setAutoSaveStatus('idle'); // Reset status to idle on new keypress
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleAutoSave(entryText);
      }, 60000); // 60 seconds
    }
  }, [entryText, editMode, selectedEntry, handleAutoSave]);

  
  // --- IMAGE HANDLING ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImageFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeNewImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  // NEW: Instantly delete an existing image
  const handleDeleteExistingImage = async (imageUrlToDelete: string) => {
    if (!selectedEntry) return;

    // Optimistically update UI
    setEditableImageUrls(prev => prev.filter(url => url !== imageUrlToDelete));

    try {
      // API call to delete the specific image from the backend
      const response = await fetch(`https://agenticairishi/api/diary/image`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId: selectedEntry.id, imageUrl: imageUrlToDelete }),
      });

      if (!response.ok) throw new Error('Failed to delete image');
      
      // On success, update the main entries state
      setEntries(prev => prev.map(entry =>
        entry.id === selectedEntry.id
          ? { ...entry, imageUrls: entry.imageUrls?.filter(url => url !== imageUrlToDelete) }
          : entry
      ));
      toast({ title: "Image Deleted", description: "The image has been removed." });

    } catch (error) {
      console.error("Failed to delete image:", error);
      // Revert UI on failure
      setEditableImageUrls(prev => [...prev, imageUrlToDelete]);
      toast({ title: "Error", description: "Could not delete the image.", variant: "destructive" });
    }
  };

  // --- MANUAL SAVE & ANALYSIS ---
  const triggerEntryAnalysis = async (entryId: string, text: string) => {
    try {
      await fetch('https://agenticairishi/api/diary/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId, text }),
      });
    } catch (error) {
      console.error('Failed to trigger entry analysis:', error);
    }
  };

  const handleSaveEntry = async () => {
    // Final manual save includes text and any NEWLY added images
    setLoading(true);
    try {
      // In a real app, upload new imageFiles and get their URLs
      const newImageUrls = imageFiles.map(file => URL.createObjectURL(file));
      const finalImageUrls = [...editableImageUrls, ...newImageUrls];

      const response = await fetch('https://agenticairishi/api/diary', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedEntry?.id,
          text: entryText,
          imageUrls: finalImageUrls,
          timestamp: selectedDate.toISOString(),
        }),
      });

      if (response.ok) {
        const savedEntryData = await response.json();
        toast({ title: "Entry Updated", description: "Your diary entry has been updated." });
        triggerEntryAnalysis(savedEntryData.id, savedEntryData.text);
        
        // Reset state after successful save
        setImageFiles([]);
        setEditMode(false);
        setAutoSaveStatus('idle');
        if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
        
        fetchEntries(); // Refetch all data
      } else {
        throw new Error('Failed to save entry');
      }
    } catch (error) {
      toast({ title: "Error", description: "Could not save your diary entry.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER LOGIC ---
  const formatDate = (timestamp: string | Date) => new Date(timestamp).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  const todayIST = getTodayInIST();
  const isFuture = selectedDate > todayIST;

  const AutoSaveIndicator = () => {
    switch (autoSaveStatus) {
      case 'saving': return <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</div>;
      case 'saved': return <div className="flex items-center text-sm text-green-600"><CheckCircle2 className="mr-2 h-4 w-4" />All changes saved</div>;
      case 'error': return <div className="flex items-center text-sm text-destructive"><AlertCircle className="mr-2 h-4 w-4" />Save failed. Please save manually.</div>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent p-4 md:p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 order-2 lg:order-1">
          <h1 className="text-4xl font-bold text-foreground mb-8">My Diary</h1>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">
                {selectedEntry
                  ? (editMode ? `Editing entry for ${formatDate(selectedEntry.timestamp)}` : `Diary for ${formatDate(selectedEntry.timestamp)}`)
                  : `Write a diary for ${formatDate(selectedDate)}`}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {isFuture && <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-l-4 border-yellow-500 rounded-r-lg"><p className="font-semibold">You cannot write a diary for a future date.</p></div>}
              
              {/* --- VIEW MODE --- */}
              {selectedEntry && !editMode && !isFuture && (
                 <div className="space-y-4">
                  <p className="text-foreground whitespace-pre-wrap text-lg leading-relaxed">{selectedEntry.text}</p>
                  {selectedEntry.imageUrls && selectedEntry.imageUrls.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedEntry.imageUrls.map((url, index) => <img key={index} src={url} alt={`Diary entry ${index + 1}`} className="rounded-lg object-cover aspect-square" />)}
                    </div>
                  )}
                  {selectedEntry.analysis && (
                    <Card className="mt-6 bg-muted/50"><CardHeader className="flex flex-row items-center space-x-3 pb-2"><Sparkles className="w-6 h-6 text-primary" /><CardTitle>AI-Powered Summary</CardTitle></CardHeader><CardContent><p className="text-muted-foreground italic">"{selectedEntry.analysis.summary}"</p></CardContent><CardFooter><Badge variant={selectedEntry.analysis.mood.toLowerCase() === 'positive' ? 'default' : 'destructive'}>Mood: {selectedEntry.analysis.mood}</Badge></CardFooter></Card>
                  )}
                   <div className="pt-4"><Button onClick={() => { setEditMode(true); setEditableImageUrls(selectedEntry.imageUrls || []); }}>Edit Entry</Button></div>
                </div>
              )}

              {/* --- EDIT / ADD MODE --- */}
              {!isFuture && (!selectedEntry || editMode) && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="entry-text" className="text-lg">How was your day?</Label>
                    <Textarea id="entry-text" placeholder="Share your thoughts, feelings, and experiences..." value={entryText} onChange={(e) => setEntryText(e.target.value)} className="min-h-48 text-base mt-2"/>
                  </div>
                  
                  {/* --- EDITABLE EXISTING IMAGES --- */}
                  {editMode && editableImageUrls.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Current Images:</h4>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {editableImageUrls.map((url, index) => (
                          <div key={index} className="relative group"><img src={url} alt={`existing entry ${index+1}`} className="w-full h-full object-cover rounded-md aspect-square" /><button onClick={() => handleDeleteExistingImage(url)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Delete image"><X size={14} /></button></div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div><Label htmlFor="image-upload" className="text-lg">Add new photos</Label><label htmlFor="image-upload" className="mt-2 flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80"><div className="flex flex-col items-center justify-center pt-5 pb-6"><Upload className="w-8 h-8 mb-4 text-muted-foreground"/><p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span></p></div><Input id="image-upload" type="file" className="hidden" multiple accept="image/*" onChange={handleImageChange} /></label></div>

                  {/* --- NEW IMAGE PREVIEWS --- */}
                  {imageFiles.length > 0 && (
                    <div><h4 className="font-semibold mb-2">New Images to Add:</h4><div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">{imageFiles.map((file, index) => (<div key={index} className="relative group"><img src={URL.createObjectURL(file)} alt={`preview ${file.name}`} className="w-full h-full object-cover rounded-md aspect-square" /><button onClick={() => removeNewImage(index)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Remove image"><X size={14} /></button></div>))}</div></div>
                  )}
                  
                  {/* --- ACTION BUTTONS & STATUS --- */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4 items-center">
                    <div className="flex-1 w-full sm:w-auto flex gap-2">
                       <Button onClick={handleSaveEntry} disabled={loading} className="flex-1" size="lg">{loading ? "Updating..." : "Update Entry"}</Button>
                       <Button variant="outline" className="flex-1" size="lg" onClick={() => { setEditMode(false); setEntryText(selectedEntry?.text || ''); setImageFiles([]); setAutoSaveStatus('idle'); }}>Cancel</Button>
                    </div>
                    <div className="flex-1 w-full sm:w-auto sm:text-right">
                       <AutoSaveIndicator />
                    </div>
                  </div>
                </div>
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