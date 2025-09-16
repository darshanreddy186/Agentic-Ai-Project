// src/components/Layout.tsx

import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
    Home,
    BookOpen,
    Heart,
    Users,
    LogOut,
    Menu,
    X,
    Sparkles,
    User,
    UserCircle
} from 'lucide-react';
import BackgroundAnimation from './BackgroundAnimation'; // Ensure the path is correct

// Define your color palettes for different mood scores
const colorPalettes = [
    // Palette for score 0-1 (e.g., Sad, Calm)
    {
        background: 'linear-gradient(to top right, #3d52a0, #7091e6, #adbbda)',
        circle: '#E6EFFF'
    },
    // Palette for score 2-3 (e.g., Anxious/Stressed)
    {
        background: 'linear-gradient(to top right, #614385, #516395)',
        circle: '#D1C4E9'
    },
    // Palette for score 4-6 (e.g., Neutral/Okay)
    {
        background: 'linear-gradient(to top right, #008080, #81c784, #b2dfdb)',
        circle: '#E0F2F1'
    },
    // Palette for score 7-8 (e.g., Happy/Positive)
    {
        background: 'linear-gradient(to top right, #ffb74d, #ffcc80, #ffe0b2)',
        circle: '#FFF8E1'
    },
    // Palette for score 9-10 (e.g., Very Happy/Joyful)
    {
        background: 'linear-gradient(to top right, #f857a6, #ff5858)',
        circle: '#FFEBEE'
    },
];

// Function to select a palette based on a score (0-10)
const getPaletteByScore = (score: number) => {
    if (score <= 1) return colorPalettes[0];
    if (score <= 3) return colorPalettes[1];
    if (score <= 6) return colorPalettes[2];
    if (score <= 8) return colorPalettes[3];
    return colorPalettes[4];
};

export function Layout() {
    const { user, signOut } = useAuth();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [currentPalette, setCurrentPalette] = useState(getPaletteByScore(5)); // Default

    const profileMenuRef = useRef<HTMLDivElement>(null);

    // Simulate fetching user's mood score
    useEffect(() => {
        const fetchMoodScore = () => {
            // In a real app, you would fetch this from your database.
            const userMoodScore = Math.floor(Math.random() * 11); // Random score for demo
            setCurrentPalette(getPaletteByScore(userMoodScore));
        };

        if (user) {
            fetchMoodScore();
        }
    }, [user]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setIsProfileMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [profileMenuRef]);

    const navigation = [
        { name: 'Home', href: '/', icon: Home },
        { name: 'Diary', href: '/diary', icon: BookOpen },
        { name: 'AI Chat', href: '/ai-chat', icon: Sparkles },
        { name: 'Relaxation', href: '/relaxation', icon: Heart },
        { name: 'Community', href: '/community', icon: Users },
    ];

    const handleSignOut = async () => {
        await signOut();
    };

    return (
        // FIX 1: Add `relative` to the main container. This creates a "stacking context"
        // so that z-index values of its children are respected relative to each other.
        <div className="relative min-h-screen" style={{ background: currentPalette.background, transition: 'background 2s ease' }}>
            
            {/* The background animation sits here, with a default z-index of 0 (from the CSS) */}
            <BackgroundAnimation circleColor={currentPalette.circle} />

            {/* The `z-50` on your nav is already correct. This ensures it's on a high layer. */}
            <nav className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        {/* Logo */}
                        <div className="flex items-center">
                            <Link to="/" className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center shadow-md">
                                    <Heart className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                                    MindfulYou
                                </span>
                            </Link>
                        </div>

                        {/* Desktop Navigation Links */}
                        <div className="hidden md:flex flex-grow items-center justify-center space-x-1">
                            {navigation.map((item) => {
                                const isActive = location.pathname === item.href;
                                return (
                                    <Link key={item.name} to={item.href} className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive ? 'bg-blue-100 text-blue-700 shadow-inner' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'}`}>
                                        <item.icon className="w-4 h-4" />
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Profile Dropdown Section */}
                        <div className="hidden md:flex items-center">
                            <div className="relative" ref={profileMenuRef}>
                                <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-blue-500 to-green-500 rounded-full text-white shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                    <User className="w-5 h-5" />
                                </button>

                                {isProfileMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 origin-top-right transition-all duration-200 ease-out transform opacity-100 scale-100">
                                        <div className="py-2">
                                            <div className="px-4 py-2 border-b border-gray-200">
                                                <p className="font-semibold text-gray-800 truncate">{user?.email}</p>
                                                <p className="text-sm text-gray-500">Your personal wellness space</p>
                                            </div>
                                            <div className="mt-2 space-y-1">
                                                <Link to="/profile" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                                    <UserCircle className="w-5 h-5 mr-3 text-gray-500" />
                                                    Profile
                                                </Link>
                                                <button onClick={handleSignOut} className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                                    <LogOut className="w-5 h-5 mr-3" />
                                                    Sign Out
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden flex items-center">
                            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-600 hover:text-blue-600 p-2">
                                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden bg-white border-t border-gray-100">
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            {navigation.map((item) => (
                                <Link key={item.name} to={item.href} onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium ${location.pathname === item.href ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                                    <item.icon className="w-5 h-5" />
                                    <span>{item.name}</span>
                                </Link>
                            ))}
                            <div className="border-t border-gray-200 my-2"></div>
                            <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-100">
                                <UserCircle className="w-5 h-5" />
                                <span>Profile</span>
                            </Link>
                            <button onClick={handleSignOut} className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50">
                                <LogOut className="w-5 h-5" />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>
                )}
            </nav>

            {/* FIX 2: Add `relative` and `z-10` to the main content area. This ensures */}
            {/* that the page content also sits on top of the background animation. */}
            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>
        </div>
    );
}