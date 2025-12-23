import smurf from "../assets/animations/smurf.riv";
import chedrick from "../assets/animations/chedrick.riv";
import pebbles from "../assets/animations/pebbles.riv";
import gooner from "../assets/animations/gooner.riv";
import kitty from "../assets/animations/kitty.riv";

import smurfAlt from "../assets/animations/smurfAlt.riv";
import chedrickAlt from "../assets/animations/chedrickAlt.riv";
import pebblesAlt from "../assets/animations/pebblesAlt.riv";
import goonerAlt from "../assets/animations/goonerAlt.riv";
import kittyAlt from "../assets/animations/kittyAlt.riv";

type AnimationAsset = number;

export type PetAnimationState = "idle" | "focus";

export interface PetAnimationConfig {
  source: AnimationAsset;
  altSource?: AnimationAsset;
  stateMachineName?: string;
  focusInputName?: string;
}

const petAnimations: Record<string, PetAnimationConfig> = {
  pet_smurf: { source: smurf, altSource: smurfAlt, stateMachineName: "State Machine 1", focusInputName: "focus" },
  pet_chedrick: { source: chedrick, altSource: chedrickAlt, stateMachineName: "State Machine 1", focusInputName: "focus" },
  pet_pebbles: { source: pebbles, altSource: pebblesAlt, stateMachineName: "State Machine 1", focusInputName: "focus" },
  pet_gooner: { source: gooner, altSource: goonerAlt, stateMachineName: "State Machine 1", focusInputName: "focus" },
  pet_kitty: { source: kitty, altSource: kittyAlt, stateMachineName: "State Machine 1", focusInputName: "focus" },
};

export const getPetAnimationConfig = (petId?: string | null): PetAnimationConfig | undefined => {
  if (!petId) return undefined;
  return petAnimations[petId];
};

export { petAnimations };
