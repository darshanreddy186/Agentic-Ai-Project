import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Play, Clock, Target } from "lucide-react";
import { WellnessSidebar } from "@/components/WellnessSidebar";

interface Recommendation {
  id: string;
  title: string;
  description: string;
  duration: string;
  activityType: string;
  category: string;
}

const RecommendationsPage = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('https://agenticairishi/api/recommendations');
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
      } else {
        // Fallback data if API fails
        setRecommendations([
          {
            id: "1",
            title: "Breathing Exercise",
            description: "Take a moment to focus on your breath and center yourself with this guided breathing exercise.",
            duration: "5 minutes",
            activityType: "breathing",
            category: "Mindfulness"
          },
          {
            id: "2",
            title: "Gratitude Journaling",
            description: "Reflect on three things you're grateful for today to boost your mood and perspective.",
            duration: "10 minutes",
            activityType: "gratitude",
            category: "Reflection"
          },
          {
            id: "3",
            title: "Quick Walk",
            description: "Step outside for a refreshing walk to clear your mind and get your body moving.",
            duration: "15 minutes",
            activityType: "walk",
            category: "Physical"
          },
          {
            id: "4",
            title: "Meditation Session",
            description: "Find inner peace with a guided meditation to reduce stress and anxiety.",
            duration: "20 minutes",
            activityType: "meditation",
            category: "Mindfulness"
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      toast({
        title: "Error",
        description: "Could not load recommendations. Showing default activities.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartActivity = async (activityType: string, title: string) => {
    try {
      const response = await fetch('https://agenticairishi/api/start-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityType,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        toast({
          title: "Activity Started",
          description: `Great choice! Enjoy your ${title.toLowerCase()}.`,
        });
      } else {
        throw new Error('Failed to start activity');
      }
    } catch (error) {
      toast({
        title: "Activity Started",
        description: `Great choice! Enjoy your ${title.toLowerCase()}.`,
      });
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Mindfulness": return "wellness-turquoise";
      case "Reflection": return "wellness-pink";
      case "Physical": return "wellness-orange";
      default: return "wellness-purple";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-accent p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <h1 className="text-3xl font-bold mb-8">Loading recommendations...</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Try This Today</h1>
          <p className="text-muted-foreground">
            Personalized wellness activities to help you feel your best.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recommendations.map((rec) => (
            <Card key={rec.id} className="card-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{rec.title}</CardTitle>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(rec.category)}`}>
                    {rec.category}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{rec.description}</p>
                
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{rec.duration}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Target className="w-4 h-4" />
                    <span>Wellness</span>
                  </div>
                </div>
                
                <Button 
                  onClick={() => handleStartActivity(rec.activityType, rec.title)}
                  className="w-full"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecommendationsPage;