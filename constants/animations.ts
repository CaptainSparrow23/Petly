import skyeIdle from "../assets/animations/skye_idle.riv";

type AnimationAsset = number;
export type PetAnimationState = "idle";

const petAnimations: Record<string, Partial<Record<PetAnimationState, AnimationAsset>>> = {
  pet_skye: { idle: skyeIdle },
};

export const getPetAnimation = (
  petId?: string | null,
  state: PetAnimationState = "idle"
): AnimationAsset | undefined => (petId ? petAnimations[petId]?.[state] : undefined);

export { petAnimations };
