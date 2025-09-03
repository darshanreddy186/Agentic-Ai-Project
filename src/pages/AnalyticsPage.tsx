import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { WellnessSidebar } from "@/components/WellnessSidebar";

interface MoodData {
  date: string;
  mood: number;
}

interface ActivityData {
  name: string;
  value: number;
  color: string;
}

interface UsageData {
  day: string;
  minutes: number;
}

const AnalyticsPage = () => {
  const [moodHistory, setMoodHistory] = useState<MoodData[]>([]);
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [usage, setUsage] = useState<UsageData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      // Fetch mood history
      const moodResponse = await fetch('https://agenticairishi/api/analytics/mood-history');
      let moodData = [];
      if (moodResponse.ok) {
        const data = await moodResponse.json();
        moodData = data.moodHistory || [];
      } else {
        // Fallback data
        moodData = [
          { date: "2024-01-01", mood: 3 },
          { date: "2024-01-02", mood: 4 },
          { date: "2024-01-03", mood: 2 },
          { date: "2024-01-04", mood: 4 },
          { date: "2024-01-05", mood: 5 },
          { date: "2024-01-06", mood: 3 },
          { date: "2024-01-07", mood: 4 },
        ];
      }

      // Fetch activities
      const activitiesResponse = await fetch('https://agenticairishi/api/analytics/activities');
      let activitiesData = [];
      if (activitiesResponse.ok) {
        const data = await activitiesResponse.json();
        activitiesData = data.activities || [];
      } else {
        // Fallback data
        activitiesData = [
          { name: "Meditation", value: 35, color: "hsl(var(--wellness-turquoise))" },
          { name: "Breathing", value: 25, color: "hsl(var(--wellness-pink))" },
          { name: "Walking", value: 20, color: "hsl(var(--wellness-orange))" },
          { name: "Journaling", value: 20, color: "hsl(var(--wellness-purple))" },
        ];
      }

      // Generate usage data
      const usageData = [
        { day: "Mon", minutes: 25 },
        { day: "Tue", minutes: 45 },
        { day: "Wed", minutes: 30 },
        { day: "Thu", minutes: 55 },
        { day: "Fri", minutes: 40 },
        { day: "Sat", minutes: 60 },
        { day: "Sun", minutes: 35 },
      ];

      setMoodHistory(moodData);
      setActivities(activitiesData);
      setUsage(usageData);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMoodLabel = (mood: number) => {
    const labels = ["", "😡", "😞", "😐", "😊", "😀"];
    return labels[mood] || "😐";
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card p-3 rounded-lg shadow-lg border">
          <p className="font-medium">{`Date: ${label}`}</p>
          <p className="text-primary">
            {`Mood: ${getMoodLabel(payload[0].value)} (${payload[0].value}/5)`}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-accent p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <h1 className="text-3xl font-bold mb-8">Loading analytics...</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Analytics</h1>
          <p className="text-muted-foreground">
            Track your wellness journey with personalized insights and trends.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Mood History Chart */}
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle>Mood History</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={moodHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    domain={[1, 5]}
                    tickFormatter={(value) => getMoodLabel(value)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="mood" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Activity Distribution */}
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle>Activity Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={activities}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {activities.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Usage */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>Weekly App Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={usage}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="day" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value) => [`${value} minutes`, 'Usage']}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="minutes" 
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;