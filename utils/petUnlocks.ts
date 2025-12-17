/**
 * Pet unlock configuration: maps pet ID to the level required to unlock it
 */
export const PET_UNLOCK_LEVELS: Record<string, number> = {
  'pet_smurf': 1,      // Level 1: Smurf
  'pet_pebbles': 3,    // Level 3: Pebbles
  'pet_chedrick': 5,   // Level 5: Chedrick
  'pet_gooner': 7,     // Level 7: Gooner
  'pet_kitty': 9,      // Level 9: Kitty
};

/**
 * Get the level required to unlock a pet
 */
export function getPetUnlockLevel(petId: string): number | null {
  return PET_UNLOCK_LEVELS[petId] ?? null;
}

/**
 * Check if a pet is unlocked for a user
 */
export function isPetUnlocked(petId: string, userLevel: number, ownedPets: string[]): boolean {
  const requiredLevel = getPetUnlockLevel(petId);
  if (requiredLevel === null) return false; // Unknown pet
  return userLevel >= requiredLevel || ownedPets.includes(petId);
}

