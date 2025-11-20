import React from "react";
import { Text, TouchableOpacity, View, Image } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/build/MaterialCommunityIcons";
import { PetTileItem, resolvePetImage, formatSpeciesUtil } from "./Tiles";

type PetPreviewCardProps = {
 pet: PetTileItem | null;
 onPurchase: () => void;
 isPurchasing: boolean;
 purchaseError?: string | null;
};

export const PetPreviewCard = ({
 pet,
 onPurchase,
 isPurchasing,
 purchaseError,
}: PetPreviewCardProps) => (
 <View
  style={{
   width: "100%",
   borderRadius: 50,
   overflow: "hidden",
  }}
 >
  {pet && (
   <Image
    source={resolvePetImage(pet)}
    resizeMode="cover"
    style={{ width: "100%", height: 400, borderRadius: 20, marginTop: 10 }}
   />
  )}

  <View className="pt-5 bg-white">
   <Text
    className="px-6 text-3xl font-bold text-black-900"
    numberOfLines={1}
   >
    {pet?.name}
   </Text>
   <Text className="px-6 mt-3 text-sm text-slate-500">
    {pet?.species ? formatSpeciesUtil(pet.species) : ""}
   </Text>
   {!!pet?.description && (
    <Text className="px-6 mt-3 text-sm leading-5 text-slate-600">
     {pet.description}
    </Text>
   )}
   <TouchableOpacity
    activeOpacity={0.85}
    onPress={onPurchase}
    disabled={!pet || isPurchasing}
    className="mx-6 mt-6 rounded-full bg-black-300 flex-row items-center justify-center"
    style={{ opacity: pet && !isPurchasing ? 1 : 0.5 }}
   >
    <View className="h-8 w-8 items-center justify-center rounded-full bg-amber-400">
     <MaterialCommunityIcons
      name="currency-usd"
      size={18}
      color="#92400e"
     />
    </View>

    <Text className="text-white py-3 ml-2 text-2xl">
     {isPurchasing
      ? "Purchasing..."
      : pet
      ? pet.priceCoins.toLocaleString()
      : ""}
    </Text>
   </TouchableOpacity>
   {!!purchaseError && (
    <Text className="px-6 mt-3 text-xs text-red-500">{purchaseError}</Text>
   )}
  </View>
 </View>
);

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
   backgroundColor: "#ffffff",
   paddingVertical: 24,
   paddingHorizontal: 20,
  }}
 >
  <Text className="text-2xl font-extrabold text-black-900">
   Not enough coins
  </Text>
  <Text className="mt-2 text-sm leading-5 text-slate-600">
   You need more coins to adopt {petName ?? "this pet"}.
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
     borderColor: "#d1d5db",
    }}
   >
    <Text className="text-center text-base font-medium text-slate-600">
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
     backgroundColor: "#000000",
    }}
   >
    <Text className="text-center text-base font-medium text-white">
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
   backgroundColor: "#ffffff",
   paddingVertical: 24,
   paddingHorizontal: 20,
  }}
 >
  <Text className="text-2xl font-extrabold text-black-900">
   Are you sure?
  </Text>
  <Text className="mt-2 text-sm leading-5 text-slate-600">
   Do you want to adopt {petName ?? "this pet"} for{" "}
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
     borderColor: "#d1d5db",
    }}
   >
    <Text className="text-center text-base font-medium text-slate-600">
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
     backgroundColor: "#000000",
    }}
   >
    <Text className="text-center text-base font-medium text-white">
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
   backgroundColor: "#ffffff",
   paddingVertical: 24,
   paddingHorizontal: 20,
  }}
 >
  <Text className="text-2xl font-extrabold text-black-900">
   Purchase successful!
  </Text>
  <Text className="mt-2 text-sm leading-5 text-slate-600">
   {petName ?? "Your new companion"} has been added to your collection.
  </Text>

  <TouchableOpacity
   activeOpacity={0.85}
   onPress={onClose}
   style={{
    marginTop: 24,
    paddingVertical: 12,
    borderRadius: 9999,
    backgroundColor: "#191d31",
   }}
  >
   <Text className="text-center text-base text-white">Back to store</Text>
  </TouchableOpacity>
 </View>
);
