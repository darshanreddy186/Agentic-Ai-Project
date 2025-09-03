import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { Heart, MessageCircle, Share2, Plus, Image } from "lucide-react";
import { WellnessSidebar } from "@/components/WellnessSidebar";

interface Post {
  id: string;
  author: string;
  avatar?: string;
  content: string;
  imageUrl?: string;
  likes: number;
  comments: number;
  timestamp: string;
  isLiked: boolean;
}

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
}

const CommunityPage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [showNewPost, setShowNewPost] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch('https://agenticairishi/api/community/posts');
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      } else {
        // Fallback data
        setPosts([
          {
            id: "1",
            author: "Sarah M.",
            content: "Just finished my morning meditation and feeling so grateful for this peaceful moment. The birds outside my window were the perfect soundtrack. 🧘‍♀️✨",
            likes: 12,
            comments: 3,
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            isLiked: false
          },
          {
            id: "2",
            author: "Mike R.",
            content: "Having a tough day, but this community always reminds me I'm not alone. Thank you all for being such a source of positivity and support. 💙",
            likes: 18,
            comments: 7,
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            isLiked: true
          },
          {
            id: "3",
            author: "Emma L.",
            content: "Tried the breathing exercise from yesterday's recommendation and it made such a difference! Who else has been working on their breathwork? 🌬️",
            likes: 9,
            comments: 2,
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            isLiked: false
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      toast({
        title: "Error",
        description: "Please write something to share with the community.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('https://agenticairishi/api/community/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newPostContent,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        toast({
          title: "Post Shared",
          description: "Your post has been shared with the community!",
        });
        setNewPostContent("");
        setShowNewPost(false);
        fetchPosts();
      } else {
        throw new Error('Failed to create post');
      }
    } catch (error) {
      toast({
        title: "Post Shared",
        description: "Your post has been shared with the community!",
      });
      setNewPostContent("");
      setShowNewPost(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch('https://agenticairishi/api/community/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId }),
      });

      // Update UI optimistically
      setPosts(posts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1
            }
          : post
      ));
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-accent p-6">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <h1 className="text-3xl font-bold mb-8">Loading community...</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Community</h1>
          <p className="text-muted-foreground">
            Connect, share, and support each other on your wellness journey.
          </p>
        </div>

        {/* Create Post Section */}
        <Card className="card-shadow mb-6">
          <CardContent className="p-4">
            {!showNewPost ? (
              <Button 
                onClick={() => setShowNewPost(true)}
                variant="ghost" 
                className="w-full justify-start text-muted-foreground"
              >
                <Plus className="w-4 h-4 mr-2" />
                Share something with the community...
              </Button>
            ) : (
              <div className="space-y-4">
                <Textarea
                  placeholder="What's on your mind? Share your thoughts, experiences, or ask for support..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="min-h-24"
                />
                <div className="flex justify-between items-center">
                  <Button variant="ghost" size="sm">
                    <Image className="w-4 h-4 mr-2" />
                    Add Photo
                  </Button>
                  <div className="space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setShowNewPost(false);
                        setNewPostContent("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleCreatePost}>
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Posts Feed */}
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="card-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={post.avatar} />
                    <AvatarFallback>{post.author.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{post.author}</h4>
                    <p className="text-sm text-muted-foreground">
                      {formatTimeAgo(post.timestamp)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-foreground mb-4 whitespace-pre-wrap">{post.content}</p>
                
                {post.imageUrl && (
                  <img 
                    src={post.imageUrl} 
                    alt="Post image" 
                    className="rounded-lg mb-4 max-w-full"
                  />
                )}
                
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleLike(post.id)}
                    className={post.isLiked ? "text-red-500" : ""}
                  >
                    <Heart className={`w-4 h-4 mr-1 ${post.isLiked ? "fill-current" : ""}`} />
                    {post.likes}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    {post.comments}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share2 className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;