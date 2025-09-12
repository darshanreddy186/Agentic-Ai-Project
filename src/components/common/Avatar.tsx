import { motion } from 'framer-motion';

interface AvatarProps {
  avatarType: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ avatarType, size = 'md', className = '' }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  const getAvatarEmoji = (type: string) => {
    if (type.includes('female')) {
      if (type.includes('child')) return '👧🏻';
      if (type.includes('teen')) return '👩🏻‍🦱';
      return '👩🏻';
    } else if (type.includes('male')) {
      if (type.includes('child')) return '👦🏻';
      if (type.includes('teen')) return '👨🏻‍🦱';
      return '👨🏻';
    }
    return '😊';
  };

  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      className={`${sizeClasses[size]} ${className} bg-gradient-to-br from-purple-200 to-pink-200 rounded-full flex items-center justify-center text-2xl shadow-lg border-4 border-white/50`}
    >
      {getAvatarEmoji(avatarType)}
    </motion.div>
  );
}