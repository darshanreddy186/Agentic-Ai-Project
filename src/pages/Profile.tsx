// src/pages/Profile.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { Edit2 } from 'lucide-react';

const CircularProgressBar = ({ percentage }: { percentage: number }) => {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="w-32 h-32">
        <circle
          className="text-gray-200"
          strokeWidth="10"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="64"
          cy="64"
        />
        <circle
          className="text-green-500"
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="64"
          cy="64"
          style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
          transform="rotate(-90 64 64)"
        />
      </svg>
      <span className="absolute text-3xl font-bold text-green-600">{percentage}</span>
    </div>
  );
};


const ProfileField = ({ label, value }: { label: string, value: string }) => (
    <div>
        <label className="text-sm font-medium text-gray-500">{label}</label>
        <div className="mt-1 p-3 bg-gray-100 rounded-lg border border-gray-200 h-12">
            <p className="text-gray-800">{value}</p>
        </div>
    </div>
);


export function Profile() {
  // In a real app, this data would come from your backend (e.g., useAuth hook)
  const userData = {
    name: 'S V Akshay Kumar',
    avatarUrl: '/path-to-your-avatar.png', // Replace with your actual avatar path
    assistantKnowledge: 70,
    dob: '',
    favoriteColor: '',
    moodAnalysis: '',
  };

  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <div className="md:col-span-1 flex flex-col items-center text-center">
          <img 
            src={userData.avatarUrl || 'https://i.pravatar.cc/300'} 
            alt="User Avatar"
            className="w-48 h-48 rounded-full object-cover shadow-2xl mb-4 border-4 border-white"
          />
          <Link 
            to="/profile/edit-avatar"
            className="flex items-center space-x-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            <span>Edit Avatar</span>
          </Link>
        </div>
        
        <div className="md:col-span-2 space-y-6">
          <h1 className="text-4xl font-bold text-gray-800 border-b-2 border-green-400 pb-2">{userData.name}</h1>
          
          <div className="flex items-center justify-between bg-green-50 p-4 rounded-xl">
            <div>
              <h2 className="text-lg font-semibold text-gray-700">Your assistant knows you</h2>
              <p className="text-sm text-gray-500">The more you interact, the better it gets!</p>
            </div>
            <CircularProgressBar percentage={userData.assistantKnowledge} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <ProfileField label="Date of birth" value={userData.dob}/>
            <ProfileField label="Favourite color" value={userData.favoriteColor}/>
          </div>
          <ProfileField label="Mood Analysis" value={userData.moodAnalysis}/>
          
          <div>
            <h3 className="text-md font-semibold text-gray-600">Saved Memories</h3>
            <Link to="/memories" className="text-blue-600 hover:underline">
              Take a look
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}