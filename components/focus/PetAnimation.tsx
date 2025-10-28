import React from 'react';
import { Text, View } from 'react-native';
import LottieView, { type LottieViewProps } from 'lottie-react-native';
import { PET_CIRCLE_SIZE } from '@/hooks/useFocus';

type Props = {
  hasPetAnimations: boolean;
  catAnimationRef: React.RefObject<LottieView | null>;
  catSource: LottieViewProps['source'];
  isRunning: boolean;
  catScale: number;
  catOffset?: { x?: number; y?: number };
  userSelectedPet?: string | null | undefined;
};


const PetAnimation = ({
  hasPetAnimations,
  catAnimationRef,
  catSource,
  isRunning,
  catScale,
  catOffset,
  userSelectedPet,
}: Props) => (
  <View
    pointerEvents="none"
    className="absolute items-center justify-center"
    style={{ width: PET_CIRCLE_SIZE, height: PET_CIRCLE_SIZE, borderRadius: PET_CIRCLE_SIZE / 2 }}
  >
    {hasPetAnimations ? (
      <LottieView
        ref={catAnimationRef}
        source={catSource}
        autoPlay
        loop={!isRunning}
        onAnimationFinish={() => {
          if (isRunning) {
            catAnimationRef.current?.reset();
            catAnimationRef.current?.play();
          }
        }}
        style={{
          width: PET_CIRCLE_SIZE,
          height: PET_CIRCLE_SIZE,
          transform: [
            { scale: catScale },
            { translateX: catOffset?.x ?? 0 },
            { translateY: catOffset?.y ?? 0 },
          ],
        }}
      />
    ) : (
      <Text className="px-6 text-center text-sm font-rubik text-slate-500">
        {userSelectedPet ? `Animations coming soon for ${userSelectedPet}` : 'Select a pet to see their focus animation'}
      </Text>
    )}
  </View>
);

export default PetAnimation;
