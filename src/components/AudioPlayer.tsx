import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipForward, SkipBack } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

export const AudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch audio URL on component mount
    const fetchAudioUrl = async () => {
      try {
        const response = await fetch("https://agenticairishi/api/story");
        const data = await response.json();
        setAudioUrl(data.audioUrl);
      } catch (error) {
        toast({
          title: "Error loading story",
          description: "Could not load the motivational story.",
          variant: "destructive",
        });
      }
    };

    fetchAudioUrl();
  }, [toast]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioUrl]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const skipTime = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds));
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="card-shadow">
      <CardHeader>
        <CardTitle>Motivational Story</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {audioUrl && (
          <audio ref={audioRef} src={audioUrl} preload="metadata" />
        )}
        
        <Progress value={progress} className="h-2" />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => skipTime(-15)}
              disabled={!audioUrl}
            >
              <SkipBack className="w-4 h-4" />
              <span className="ml-1 text-xs">15s</span>
            </Button>
            
            <Button
              variant="default"
              size="sm"
              onClick={togglePlayPause}
              disabled={!audioUrl}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => skipTime(15)}
              disabled={!audioUrl}
            >
              <SkipForward className="w-4 h-4" />
              <span className="ml-1 text-xs">15s</span>
            </Button>
          </div>
          
          {duration > 0 && audioRef.current && (
            <span className="text-sm text-muted-foreground">
              {formatTime(audioRef.current.currentTime)} / {formatTime(duration)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};