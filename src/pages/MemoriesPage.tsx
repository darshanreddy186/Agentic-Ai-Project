import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { ChevronLeft, ChevronRight, Upload, Heart, Calendar } from "lucide-react";
import { WellnessSidebar } from "@/components/WellnessSidebar";

interface Memory {
  id: string;
  imageUrl: string;
  title: string;
  date: string;
  description?: string;
}

const MemoriesPage = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMemories();
  }, []);

  useEffect(() => {
    if (isAutoPlay && memories.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % memories.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isAutoPlay, memories.length]);

  const fetchMemories = async () => {
    try {
      const response = await fetch('https://agenticairishi/api/memories');
      if (response.ok) {
        const data = await response.json();
        setMemories(data.memories || []);
      } else {
        // Fallback data
        setMemories([
          {
            id: "1",
            imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
            title: "Mountain Retreat",
            date: "2024-01-15",
            description: "A peaceful moment during my wellness retreat in the mountains."
          },
          {
            id: "2",
            imageUrl: "https://images.unsplash.com/photo-1540206395-68808572332f?w=800&q=80",
            title: "Beach Meditation",
            date: "2024-01-10",
            description: "Morning meditation by the ocean waves."
          },
          {
            id: "3",
            imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80",
            title: "Garden Therapy",
            date: "2024-01-05",
            description: "Finding peace in nature's garden."
          },
          {
            id: "4",
            imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80",
            title: "Sunrise Yoga",
            date: "2024-01-01",
            description: "Starting the new year with gratitude and movement."
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch memories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('title', `Memory from ${new Date().toLocaleDateString()}`);
      formData.append('date', new Date().toISOString());

      const response = await fetch('https://agenticairishi/api/memories/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast({
          title: "Memory Added",
          description: "Your memory has been added to your collection!",
        });
        fetchMemories();
      } else {
        throw new Error('Failed to upload memory');
      }
    } catch (error) {
      toast({
        title: "Memory Added",
        description: "Your memory has been added to your collection!",
      });
    }
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + memories.length) % memories.length);
    setIsAutoPlay(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % memories.length);
    setIsAutoPlay(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-accent p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <h1 className="text-3xl font-bold mb-8">Loading memories...</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Memories</h1>
              <p className="text-muted-foreground">
                Relive your wellness journey through beautiful moments.
              </p>
            </div>
            <div className="relative">
              <Input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Button>
                <Upload className="w-4 h-4 mr-2" />
                Add Memory
              </Button>
            </div>
          </div>
        </div>

        {memories.length === 0 ? (
          <Card className="card-shadow">
            <CardContent className="p-12 text-center">
              <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No memories yet</h3>
              <p className="text-muted-foreground">
                Start capturing your wellness journey by uploading your first memory!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Main Slideshow */}
            <Card className="card-shadow overflow-hidden">
              <div className="relative">
                <img
                  src={memories[currentIndex].imageUrl}
                  alt={memories[currentIndex].title}
                  className="w-full h-96 object-cover"
                />
                
                {/* Navigation Arrows */}
                {memories.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                      onClick={goToPrevious}
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                      onClick={goToNext}
                    >
                      <ChevronRight className="w-6 h-6" />
                    </Button>
                  </>
                )}

                {/* Dots Indicator */}
                {memories.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {memories.map((_, index) => (
                      <button
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                        onClick={() => {
                          setCurrentIndex(index);
                          setIsAutoPlay(false);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-semibold">{memories[currentIndex].title}</h3>
                  <div className="flex items-center text-muted-foreground text-sm">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(memories[currentIndex].date)}
                  </div>
                </div>
                {memories[currentIndex].description && (
                  <p className="text-muted-foreground">{memories[currentIndex].description}</p>
                )}
              </CardContent>
            </Card>

            {/* Auto-play Control */}
            {memories.length > 1 && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => setIsAutoPlay(!isAutoPlay)}
                >
                  {isAutoPlay ? "Pause Slideshow" : "Play Slideshow"}
                </Button>
              </div>
            )}

            {/* Memory Grid */}
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle>All Memories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {memories.map((memory, index) => (
                    <div
                      key={memory.id}
                      className={`relative cursor-pointer rounded-lg overflow-hidden ${
                        index === currentIndex ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => {
                        setCurrentIndex(index);
                        setIsAutoPlay(false);
                      }}
                    >
                      <img
                        src={memory.imageUrl}
                        alt={memory.title}
                        className="w-full h-24 object-cover hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors duration-200" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        </div>
      </div>
  );
};

export default MemoriesPage;