import { Card, CardContent } from "@/components/ui/card";
import meditationIllustration from "@/assets/meditation-illustration.png";

export const DailyRecommendation = () => {
  return (
    <Card className="card-shadow h-fit">
      <CardContent className="p-6">
        <h3 className="text-xl font-bold mb-4">Daily Recommendation</h3>
        
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-muted-foreground mb-2">You seem stressed 😊</p>
            <p className="text-lg font-medium mb-4">
              → Try 5-min breathing 🧘
            </p>
          </div>
          
          <div className="flex-shrink-0 ml-4">
            <img
              src={meditationIllustration}
              alt="Meditation illustration"
              className="w-32 h-24 object-cover rounded-lg"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};