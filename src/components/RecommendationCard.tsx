import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Recommendation {
  title: string;
  status: string;
  suggestion: string;
  activityType: string;
}

export const RecommendationCard = () => {
  const [recommendation, setRecommendation] = useState<Recommendation>({
    title: "Daily Recommendation",
    status: "You seem stressed",
    suggestion: "Try 10-min nap",
    activityType: "nap"
  });
  const { toast } = useToast();

  useEffect(() => {
    // Fetch daily recommendation on component mount
    const fetchRecommendation = async () => {
      try {
        const response = await fetch("https://agenticairishi/api/daily-recommendation");
        if (response.ok) {
          const data = await response.json();
          setRecommendation(data);
        }
      } catch (error) {
        // Keep default recommendation if API fails
        console.log("Using default recommendation");
      }
    };

    fetchRecommendation();
  }, []);

  const handleStartActivity = async () => {
    try {
      const response = await fetch("https://agenticairishi/api/start-activity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ activityType: recommendation.activityType }),
      });

      if (response.ok) {
        toast({
          title: "Activity started",
          description: `Starting your ${recommendation.activityType} session...`,
        });
      } else {
        toast({
          title: "Error starting activity",
          description: "Please try again later.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Network error",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="card-shadow h-fit">
      <CardContent className="p-6">
        <h3 className="text-xl font-bold mb-4">{recommendation.title}</h3>
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <p className="text-muted-foreground mb-2">{recommendation.status}</p>
            <p className="text-lg font-medium mb-4">
              → {recommendation.suggestion}
            </p>
          </div>
          
          <div className="flex-shrink-0 ml-4">
            {/* Meditation SVG illustration */}
            <div className="w-32 h-24 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-primary"
              >
                <path
                  d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2Z"
                  fill="currentColor"
                />
                <path
                  d="M21 9V7L15 8L13.5 7C12.67 6.67 11.33 6.67 10.5 7L9 8L3 7V9L9 10L10.5 10.5C11.33 10.83 12.67 10.83 13.5 10.5L15 10L21 9Z"
                  fill="currentColor"
                />
                <path
                  d="M12 10C11.45 10 10.95 10.22 10.59 10.59C10.22 10.95 10 11.45 10 12V22H14V12C14 11.45 13.78 10.95 13.41 10.59C13.05 10.22 12.55 10 12 10Z"
                  fill="currentColor"
                />
              </svg>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleStartActivity} 
          className="w-full"
        >
          Start Now
        </Button>
      </CardContent>
    </Card>
  );
};
