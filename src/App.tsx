import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import DiaryPage from "./pages/DiaryPage";
import RecommendationsPage from "./pages/RecommendationsPage";
import CommunityPage from "./pages/CommunityPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import MemoriesPage from "./pages/MemoriesPage";
import MoodTrackerPage from "./pages/MoodTrackerPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/diary" element={<DiaryPage />} />
          <Route path="/recommendations" element={<RecommendationsPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/memories" element={<MemoriesPage />} />
          <Route path="/mood-tracker" element={<MoodTrackerPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
