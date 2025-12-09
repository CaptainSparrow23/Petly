import smurf from "../assets/animations/smurf.riv";
import chedrick from "../assets/animations/chedrick.riv";
import pebbles from "../assets/animations/pebbles.riv";
import gooner from "../assets/animations/gooner.riv";
import kitty from "../assets/animations/kitty.riv";

type AnimationAsset = number;

export type PetAnimationState = "idle" | "focus";

export interface PetAnimationConfig {
  source: AnimationAsset;
  stateMachineName?: string;
  focusInputName?: string;
}

const petAnimations: Record<string, PetAnimationConfig> = {
  pet_smurf: { source: smurf, stateMachineName: "State Machine 1", focusInputName: "focus" },
  pet_chedrick: { source: chedrick, stateMachineName: "State Machine 1", focusInputName: "focus" },
  pet_pebbles: { source: pebbles, stateMachineName: "State Machine 1", focusInputName: "focus" },
  pet_gooner: { source: gooner, stateMachineName: "State Machine 1", focusInputName: "focus" },
  pet_kitty: { source: kitty, stateMachineName: "State Machine 1", focusInputName: "focus" },
};

export const getPetAnimationConfig = (petId?: string | null): PetAnimationConfig | undefined => {
  if (!petId) return undefined;
  return petAnimations[petId];
};

export { petAnimations };
