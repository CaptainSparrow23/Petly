import React from "react";
import { Text, TouchableOpacity, View, Image, ImageBackground } from "react-native";
import { StoreItem } from "./Tiles";
import { CoralPalette } from "@/constants/colors";
import images from "@/constants/images";
import PetAnimation from "@/components/focus/PetAnimation";
import { getPetAnimationConfig } from "@/constants/animations";

type PetPreviewCardProps = {
 pet: StoreItem | null;
 selectedPet?: string | null; // User's current selected pet for accessory previews
 onPurchase: () => void;
 isPurchasing: boolean;
 purchaseError?: string | null;
};

export const PetPreviewCard = ({
 pet,
 selectedPet,
 onPurchase,
 isPurchasing,
 purchaseError,
}: PetPreviewCardProps) => {
 // Determine which accessory to show based on item category
 const getAccessoryProps = () => {
   if (!pet) return { selectedHat: null, selectedFace: null, selectedCollar: null };
   
   switch (pet.category) {
     case 'Hat':
       return { selectedHat: pet.id, selectedFace: null, selectedCollar: null };
     case 'Face':
       return { selectedHat: null, selectedFace: pet.id, selectedCollar: null };
     case 'Collar':
       return { selectedHat: null, selectedFace: null, selectedCollar: pet.id };
     default:
       return { selectedHat: null, selectedFace: null, selectedCollar: null };
   }
 };

  const accessoryProps = getAccessoryProps();
 const isAccessory = pet?.category === 'Hat' || pet?.category === 'Face' || pet?.category === 'Collar';
 const petAnimConfig = isAccessory ? getPetAnimationConfig(selectedPet) : getPetAnimationConfig(pet?.id);

 return (
 <View
  style={{
   width: "100%",
   borderRadius: 30,
   overflow: "hidden",
  }}
 >
  {pet && (
   <>
    {pet.category === 'Pet' ? (
     <ImageBackground
      source={images.roomBackGround}
      resizeMode="cover"
      style={{ width: "100%", height: 400, borderRadius: 20, marginTop: 10, overflow: "hidden" }}
     >
      {(() => {
        const animConfig = getPetAnimationConfig(pet.id);
        if (animConfig) {
          return (
            <PetAnimation
              source={animConfig.source}
              stateMachineName={animConfig.stateMachineName}
              focusInputName={animConfig.focusInputName}
              isFocus={false}
              containerStyle={{ flex: 1, position: "absolute", top: 50, left: 0, right: 0, bottom: 0 }}
              animationStyle={{ width: "50%", height: "50%" }}
            />
          );
        }
        return (
          <Image
            source={images[pet.id as keyof typeof images] ?? images.lighting}
            resizeMode="contain"
            style={{ width: "100%", height: "100%" }}
          />
        );
      })()}
     </ImageBackground>
    ) : isAccessory && petAnimConfig ? (
     <ImageBackground
      source={images.roomBackGround}
      resizeMode="cover"
      style={{ width: "100%", height: 400, borderRadius: 20, marginTop: 10, overflow: "hidden" }}
     >
      <PetAnimation
        source={petAnimConfig.source}
        stateMachineName={petAnimConfig.stateMachineName}
        focusInputName={petAnimConfig.focusInputName}
        isFocus={false}
        selectedHat={accessoryProps.selectedHat}
        selectedFace={accessoryProps.selectedFace}
        selectedCollar={accessoryProps.selectedCollar}
        containerStyle={{ flex: 1, position: "absolute", top: 50, left: 0, right: 0, bottom: 0 }}
        animationStyle={{ width: "50%", height: "50%" }}
      />
     </ImageBackground>
    ) : (
     <View style={{ width: "100%", height: 400, borderRadius: 20, marginTop: 10, overflow: "hidden", backgroundColor: CoralPalette.white, alignItems: "center", justifyContent: "center" }}>
      <Image
        source={images[pet.id as keyof typeof images] ?? images.lighting}
        resizeMode="contain"
        style={{ width: "70%", height: "70%" }}
      />
     </View>
    )}
   </>
  )}

  <View className="pt-5" style={{ backgroundColor: CoralPalette.white}}>
    <Text
      className="px-6 text-3xl font-bold"
      style={{ color: CoralPalette.dark, fontFamily: "Nunito" }}
      numberOfLines={1}
    >
      {pet?.name}
    </Text>
    {!!pet?.description && (
      <Text className="px-6 mt-3 text-sm leading-5" style={{ color: CoralPalette.mutedDark, fontFamily: "Nunito" }}>
        {pet.description}
      </Text>
    )}
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPurchase}
      disabled={!pet || isPurchasing}
      className="mx-6 mt-6 rounded-full flex-row items-center justify-center"
    style={{
      opacity: pet && !isPurchasing ? 1 : 0.5,
      backgroundColor: CoralPalette.primary,
      paddingVertical: 10,
    }}
  >
    <View className="h-8 w-8 items-center justify-center">
      <Image source={images.token} style={{ width: 25, height: 25 }} resizeMode="contain" />
    </View>

      <Text className="py-3 ml-2 text-2xl" style={{ color: CoralPalette.white, fontFamily: "Nunito", fontWeight: "800" }}>
        {isPurchasing
          ? "Purchasing..."
          : pet
          ? pet.priceCoins.toLocaleString()
          : ""}
      </Text>
    </TouchableOpacity>
    {!!purchaseError && (
      <Text className="px-6 mt-3 text-xs" style={{ color: CoralPalette.primary, fontFamily: "Nunito" }}>{purchaseError}</Text>
    )}
  </View>
 </View>
 );
};

type InsufficientCoinsCardProps = {
  petName?: string | null;
  onClose: () => void;
  onGetMoreCoins: () => void;
};

export const InsufficientCoinsCard = ({
  petName,
  onClose,
  onGetMoreCoins,
}: InsufficientCoinsCardProps) => (
 <View
  style={{
   width: "100%",
   backgroundColor: CoralPalette.white,
   paddingVertical: 24,
   paddingHorizontal: 20,

  }}
 >
  <Text className="text-2xl font-extrabold" style={{ color: CoralPalette.dark, fontFamily: "Nunito" }}>
   Not enough coins
  </Text>
  <Text className="mt-2 text-sm leading-5" style={{ color: CoralPalette.mutedDark, fontFamily: "Nunito" }}>
   You need more coins to purchase {petName ?? "this item"}.
  </Text>

  <View className="mt-6 flex-row items-center justify-between">
   <TouchableOpacity
    activeOpacity={0.85}
    onPress={onClose}
    style={{
     flex: 1,
     marginRight: 6,
     paddingVertical: 12,
     borderRadius: 9999,
     borderWidth: 1,
     borderColor: CoralPalette.border,
    }}
   >
    <Text className="text-center text-base font-medium" style={{ color: CoralPalette.mutedDark, fontFamily: "Nunito" }}>
     Back
    </Text>
   </TouchableOpacity>

   <TouchableOpacity
    activeOpacity={0.85}
    onPress={onGetMoreCoins}
    style={{
     flex: 1,
     marginLeft: 6,
     paddingVertical: 12,
     borderRadius: 9999,
     backgroundColor: CoralPalette.primary,
     opacity: 0.95,
    }}
   >
    <Text className="text-center text-base font-medium" style={{ color: CoralPalette.white, fontFamily: "Nunito" }}>
     Get more coins
    </Text>
   </TouchableOpacity>
  </View>
 </View>
);

type PurchaseConfirmationCardProps = {
 petName?: string | null;
 petPrice?: number | null;
 onConfirm: () => void;
 onCancel: () => void;
 isConfirming: boolean;
};

export const PurchaseConfirmationCard = ({
 petName,
 petPrice,
 onConfirm,
 onCancel,
 isConfirming,
}: PurchaseConfirmationCardProps) => (
 <View
  style={{
   width: "100%",
   backgroundColor: CoralPalette.white,
   paddingVertical: 24,
   paddingHorizontal: 20,

  }}
 >
  <Text className="text-2xl font-extrabold" style={{ color: CoralPalette.dark, fontFamily: "Nunito" }}>
   Are you sure?
  </Text>
  <Text className="mt-2 text-sm leading-5" style={{ color: CoralPalette.mutedDark, fontFamily: "Nunito" }}>
   Do you want to purchase {petName ?? "this item"} for{" "}
   {petPrice?.toLocaleString() ?? ""} coins?
  </Text>

  <View className="mt-6 flex-row items-center justify-between">
   <TouchableOpacity
    activeOpacity={0.85}
    onPress={onCancel}
    disabled={isConfirming}
    style={{
     flex: 1,
     marginRight: 6,
     paddingVertical: 12,
     borderRadius: 9999,
     borderWidth: 1,
     borderColor: CoralPalette.border,
    }}
   >
    <Text className="text-center text-base font-medium" style={{ color: CoralPalette.mutedDark, fontFamily: "Nunito" }}>
     Cancel
    </Text>
   </TouchableOpacity>

   <TouchableOpacity
    activeOpacity={0.85}
    onPress={onConfirm}
    disabled={isConfirming}
    style={{
     flex: 1,
     marginLeft: 6,
     paddingVertical: 12,
     borderRadius: 9999,
     backgroundColor: CoralPalette.primary,
     opacity: 0.95,
    }}
   >
    <Text className="text-center text-base font-medium" style={{ color: CoralPalette.white, fontFamily: "Nunito" }}>
     {isConfirming ? "Confirming..." : "Confirm"}
    </Text>
   </TouchableOpacity>
  </View>
 </View>
);

type PurchaseSuccessCardProps = {
 petName?: string | null;
 onClose: () => void;
};

export const PurchaseSuccessCard = ({
 petName,
 onClose,
}: PurchaseSuccessCardProps) => (
 <View
  style={{
   width: "100%",
   backgroundColor: CoralPalette.white,
   paddingVertical: 24,
   paddingHorizontal: 20,

  }}
 >
  <Text className="text-2xl font-extrabold" style={{ color: CoralPalette.dark, fontFamily: "Nunito" }}>
   Purchase successful!
  </Text>
  <Text className="mt-2 text-sm leading-5" style={{ color: CoralPalette.mutedDark, fontFamily: "Nunito" }}>
   {petName ?? "Your new companion"} has been added to your collection.
  </Text>

  <TouchableOpacity
   activeOpacity={0.85}
   onPress={onClose}
   style={{
    marginTop: 24,
    paddingVertical: 12,
    borderRadius: 9999,
    backgroundColor: CoralPalette.primary,
    opacity: 0.95,
   }}
  >
   <Text className="text-center text-base" style={{ color: CoralPalette.white, fontFamily: "Nunito", fontWeight: "700" }}>
    Back to store
   </Text>
  </TouchableOpacity>
 </View>
);
