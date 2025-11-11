import skyeIdle from "../assets/animations/skye_idle.riv";
import skyeFocus from "../assets/animations/skye_focus.riv";

type AnimationAsset = number;
export type PetAnimationState = "idle" | "focus";

const petAnimations: Record<string, Partial<Record<PetAnimationState, AnimationAsset>>> = {
  pet_skye: { idle: skyeIdle, focus: skyeFocus },
};

export const getPetAnimation = (
  petId?: string | null,
  state: PetAnimationState = "idle"
): AnimationAsset | undefined => (petId ? petAnimations[petId]?.[state] : undefined);

export { petAnimations };
