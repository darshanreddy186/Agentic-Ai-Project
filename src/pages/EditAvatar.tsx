// src/pages/EditAvatar.tsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const pixelAvatars = [
    '/avatars/pixel-1.png', '/avatars/pixel-2.png', '/avatars/pixel-3.png', 
    '/avatars/pixel-4.png', '/avatars/pixel-5.png', '/avatars/pixel-6.png', 
    '/avatars/pixel-7.png', '/avatars/pixel-8.png', '/avatars/pixel-9.png', 
    '/avatars/pixel-10.png', '/avatars/pixel-11.png', '/avatars/pixel-12.png',
];

export function EditAvatar() {
  const navigate = useNavigate();
  const [selectedAvatar, setSelectedAvatar] = useState('/path-to-your-avatar.png'); // Current avatar
  const [previewAvatar, setPreviewAvatar] = useState(selectedAvatar);

  const handleSave = () => {
    // In a real app, you would save the selectedAvatar URL to your backend here
    console.log('Saving avatar:', previewAvatar);
    setSelectedAvatar(previewAvatar);
    navigate('/profile'); // Go back to profile after saving
  };
  
  return (
    <div className="bg-gray-900 text-white rounded-2xl p-8 shadow-2xl relative min-h-[70vh] flex flex-col">
      <button onClick={() => navigate(-1)} className="absolute top-6 left-6 flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
        <ArrowLeft className="w-5 h-5" />
        <span>Go Back</span>
      </button>

      <div className="flex-grow flex items-center justify-center">
        <img 
          src={previewAvatar || 'https://i.pravatar.cc/300'} 
          alt="Avatar Preview"
          className="w-64 h-64 rounded-full object-cover shadow-lg border-4 border-gray-700"
        />
      </div>
      
      <div className="bg-gray-800/50 rounded-lg p-4 mt-8">
        <div className="flex overflow-x-auto space-x-4 pb-4">
          {pixelAvatars.map((avatar, index) => (
            <button key={index} onClick={() => setPreviewAvatar(avatar)} className="flex-shrink-0">
              <img 
                src={avatar} 
                alt={`Avatar option ${index + 1}`}
                className={`w-20 h-20 rounded-lg transition-all duration-200 ${previewAvatar === avatar ? 'border-4 border-blue-500 scale-110' : 'border-2 border-transparent hover:border-blue-400'}`}
              />
            </button>
          ))}
        </div>
        <div className="flex justify-end space-x-4 mt-4">
          <button className="px-6 py-2 rounded-lg font-semibold text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors">
            Edit
          </button>
          <button onClick={handleSave} className="px-6 py-2 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}