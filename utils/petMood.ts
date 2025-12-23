/**
 * Pet mood system based on time since last focus session.
 * 
 * Mood levels:
 * - 3 (Happy): Within 48 hours of last session
 * - 2 (Neutral): 48-96 hours since last session
 * - 1 (Sad): More than 96 hours since last session, or no session ever
 */

import images from '@/constants/images';
import { ImageSourcePropType } from 'react-native';

export type PetMood = 1 | 2 | 3;

/**
 * Computes the pet's mood based on the last session timestamp.
 * 
 * @param updatedAt - ISO string timestamp of the pet's last focus session, or null if never used
 * @returns PetMood (1 = sad, 2 = neutral, 3 = happy)
 */
export function getPetMood(updatedAt: string | null | undefined): PetMood {
  if (!updatedAt) return 1; // No session ever = sad

  const lastSession = new Date(updatedAt);
  const now = new Date();
  const hoursElapsed = (now.getTime() - lastSession.getTime()) / (1000 * 60 * 60);

  if (hoursElapsed < 24) return 3;  
  if (hoursElapsed < 168) return 2;  
  return 1;                         
}

/**
 * Returns a human-readable label for the pet's mood.
 */
export function getPetMoodLabel(mood: PetMood): string {
  switch (mood) {
    case 3: return 'Happy';
    case 2: return 'Okay';
    case 1: return 'Lonely';
  }
}

/**
 * Returns an emoji for the pet's mood.
 */
export function getPetMoodEmoji(mood: PetMood): string {
  switch (mood) {
    case 3: return '😊';
    case 2: return '😐';
    case 1: return '😢';
  }
}

/**
 * Mood-based image mapping for each pet.
 * Mood 2 (neutral) uses the default pet image.
 */
const PET_MOOD_IMAGES: Record<string, Record<PetMood, ImageSourcePropType>> = {
  pet_smurf: {
    1: images.smurf1,
    2: images.pet_smurf,
    3: images.smurf3,
  },
  pet_chedrick: {
    1: images.chedrick1,
    2: images.pet_chedrick,
    3: images.chedrick3,
  },
  pet_pebbles: {
    1: images.pebbles1,
    2: images.pet_pebbles,
    3: images.pebbles3,
  },
  pet_gooner: {
    1: images.gooner1,
    2: images.pet_gooner,
    3: images.gooner3,
  },
  pet_kitty: {
    1: images.kitty1,
    2: images.pet_kitty,
    3: images.kitty3,
  },
};

/**
 * Returns the appropriate image for a pet based on their mood.
 * Falls back to the default pet image if not found.
 */
export function getPetImageByMood(petId: string, mood: PetMood): ImageSourcePropType {
  const petImages = PET_MOOD_IMAGES[petId];
  if (petImages) {
    return petImages[mood];
  }
  // Fallback to default pet image
  return images[petId as keyof typeof images] ?? images.lighting;
}
