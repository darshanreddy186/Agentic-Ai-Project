import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Upload, Calendar } from "lucide-react";
import { WellnessSidebar } from "@/components/WellnessSidebar";

interface DiaryEntry {
  id: string;
  text: string;
  imageUrl?: string;
  timestamp: string;
}

const DiaryPage = () => {
  const [entryText, setEntryText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const response = await fetch('https://agenticairishi/api/diary/list');
      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries || []);
      }
    } catch (error) {
      console.error('Failed to fetch entries:', error);
    }
  };

  const handleSaveEntry = async () => {
    if (!entryText.trim()) {
      toast({
        title: "Error",
        description: "Please write something in your diary entry.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const userId = null; // Replace with actual auth
      const tempUserId = localStorage.getItem('tempUserId') || `temp-${Date.now()}`;
      if (!localStorage.getItem('tempUserId')) {
        localStorage.setItem('tempUserId', tempUserId);
      }

      let imageUrl = null;
      if (imageFile) {
        // In a real app, you would upload the image to a service
        imageUrl = URL.createObjectURL(imageFile);
      }

      const response = await fetch('https://agenticairishi/api/diary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          tempUserId,
          text: entryText,
          imageUrl,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        toast({
          title: "Entry Saved",
          description: "Your diary entry has been saved successfully.",
        });
        setEntryText("");
        setImageFile(null);
        fetchEntries();
      } else {
        throw new Error('Failed to save entry');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not save your diary entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8">My Diary</h1>
        
        {/* New Entry Card */}
        <Card className="card-shadow mb-8">
          <CardHeader>
            <CardTitle>Write a new entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="entry-text">How was your day?</Label>
              <Textarea
                id="entry-text"
                placeholder="Share your thoughts, feelings, and experiences..."
                value={entryText}
                onChange={(e) => setEntryText(e.target.value)}
                className="min-h-32"
              />
            </div>
            
            <div>
              <Label htmlFor="image-upload">Add a photo (optional)</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="flex-1"
                />
                <Upload className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
            
            <Button 
              onClick={handleSaveEntry} 
              disabled={loading}
              className="w-full"
            >
              {loading ? "Saving..." : "Save Entry"}
            </Button>
          </CardContent>
        </Card>

        {/* Previous Entries */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Previous Entries</h2>
          {entries.length === 0 ? (
            <Card className="card-shadow">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No diary entries yet. Start writing your first entry above!</p>
              </CardContent>
            </Card>
          ) : (
            entries.map((entry) => (
              <Card key={entry.id} className="card-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {formatDate(entry.timestamp)}
                    </span>
                  </div>
                  <p className="text-foreground whitespace-pre-wrap">{entry.text}</p>
                  {entry.imageUrl && (
                    <img 
                      src={entry.imageUrl} 
                      alt="Diary entry" 
                      className="mt-4 rounded-lg max-w-md"
                    />
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DiaryPage;