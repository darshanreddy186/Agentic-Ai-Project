import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, PlayCircle, Volume2, Headphones } from 'lucide-react';

// --- Type Definitions ---
interface StoryDetailData {
    id: string;
    title: string;
    description: string;
    image: string;
    category: string;
    content: string[]; // An array of paragraphs
    audioUrl?: string; // Optional audio URL
}

// --- Mock Database for Stories ---
const allStories: StoryDetailData[] = [
    {
        id: 'the-calm-river',
        title: 'The Calm River',
        description: 'Finding peace in the flow of nature and mindful breathing.',
        image: 'https://images.unsplash.com/photo-1502602898657-3e91760c0341?q=80&w=1000&auto=format&fit=crop',
        category: 'Mindfulness',
        content: [
            "The river doesn't rush. It flows. It moves with a gentle, persistent strength, carving its path through the landscape without hurry. This is the first lesson of the calm river: true progress is not about speed, but about steady, mindful movement.",
            "Find a comfortable place to sit, close your eyes, and imagine this river. Picture the sunlight dancing on its surface, the smooth stones beneath the current, and the green banks that hold it. This river is within you. It is your breath.",
            "Inhale slowly, deeply, and feel the current of your breath flow in. Exhale just as slowly, and feel it release. Like the river, your breath is a constant, life-giving force. It asks for nothing but your attention. By focusing on this simple, natural rhythm, you anchor yourself in the present moment, letting go of past regrets and future anxieties.",
            "The river teaches us acceptance. It doesn't fight the rocks in its path; it flows around them. It embraces the rain that swells its banks and the sun that warms its waters. In the same way, we can learn to accept our thoughts and feelings without judgment, allowing them to pass like leaves floating downstream."
        ],
        audioUrl: '/audio/the-calm-river.mp3' // Example path
    },
    // ... add other stories here
];


export function StoryDetail() {
    const { storyId } = useParams<{ storyId: string }>();
    const navigate = useNavigate();
    const [story, setStory] = useState<StoryDetailData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate fetching data for the specific story
        const fetchStory = () => {
            const foundStory = allStories.find(s => s.id === storyId);
            setTimeout(() => {
                setStory(foundStory || null);
                setLoading(false);
            }, 500); // Simulate network delay
        };

        fetchStory();
    }, [storyId]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading story...</div>;
    }

    if (!story) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50">Story not found.</div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
            <header className="fixed top-0 left-0 right-0 z-50 p-4 bg-white/80 backdrop-blur-sm">
                <div className="max-w-4xl mx-auto">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
                        <ArrowLeft className="w-5 h-5" />
                        Back to Home
                    </button>
                </div>
            </header>

            <main className="pt-24 pb-12">
                <div className="max-w-4xl mx-auto px-4">
                    <article>
                        <div className="mb-8">
                            <span className="text-indigo-600 font-semibold">{story.category}</span>
                            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mt-2 mb-4">{story.title}</h1>
                            <p className="text-lg text-gray-600">{story.description}</p>
                        </div>

                        <div className="relative rounded-2xl overflow-hidden shadow-2xl mb-12">
                            <img src={story.image} alt={story.title} className="w-full h-96 object-cover" />
                             <div className="absolute inset-0 bg-black/20"></div>
                        </div>

                        {story.audioUrl && (
                             <div className="bg-white rounded-2xl shadow-xl p-6 mb-12 border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <Headphones className="w-8 h-8 text-indigo-500"/>
                                    <div>
                                        <h3 className="font-bold text-gray-800">Listen to this story</h3>
                                        <p className="text-sm text-gray-500">Audio version available</p>
                                    </div>
                                </div>
                                <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full font-semibold shadow-lg hover:scale-105 transition-transform">
                                    <PlayCircle className="w-6 h-6"/>
                                    Play Audio
                                </button>
                            </div>
                        )}

                        <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed space-y-6">
                            {story.content.map((paragraph, index) => (
                                <p key={index}>{paragraph}</p>
                            ))}
                        </div>
                    </article>
                </div>
            </main>
        </div>
    );
}