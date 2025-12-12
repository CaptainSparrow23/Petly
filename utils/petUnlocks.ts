/**
 * Pet unlock configuration: maps pet ID to the level required to unlock it
 */
export const PET_UNLOCK_LEVELS: Record<string, number> = {
  'pet_smurf': 2,      // Level 2: Smurf (after tutorial)
  'pet_chedrick': 4,   // Level 4: Chedrick
  'pet_gooner': 6,     // Level 6: Gooner
  'pet_pebbles': 8,    // Level 8: Pebbles
  'pet_kitty': 10,     // Level 10: Kitty
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

