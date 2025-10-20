//this is a reusable component for displaying profile pictures based on profileId

import React from 'react';
import { View, Image } from 'react-native';
import images from '@/constants/images';

interface ProfilePictureProps {
  profileId: number | null;
  size?: number;
  className?: string;
}

const PROFILE_IMAGES = {
  1: images.profile1,
  2: images.profile2,
};

export const ProfilePicture: React.FC<ProfilePictureProps> = ({ 
  profileId, 
  size = 40,
  className = ""
}) => {
  const imageSource = profileId && PROFILE_IMAGES[profileId as keyof typeof PROFILE_IMAGES] 
    ? PROFILE_IMAGES[profileId as keyof typeof PROFILE_IMAGES]
    : images.profile1; // default to profile1

  return (
    <View 
      className={`rounded-full overflow-hidden ${className}`}
      style={{ width: size, height: size }} // gray-200 background
    >
      <Image
        source={imageSource}
        style={{ width: size, height: size }}
        resizeMode="cover"
      />
    </View>
  );
};
