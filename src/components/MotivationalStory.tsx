import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const MotivationalStory = () => {
  return (
    <Card className="card-shadow">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Motivational Story</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">A Journey Through Adversity</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Once upon a time, in a land far away...
          </p>
        </div>

        <Progress value={35} className="h-2" />

        <div className="flex items-center justify-between">
          <Button variant="default" size="sm" className="flex items-center space-x-2">
            <Play className="w-4 h-4" />
            <span>Narrate</span>
          </Button>

          <Button variant="ghost" size="sm" className="flex items-center space-x-2">
            <span>Narrate</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};