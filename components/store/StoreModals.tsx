import React from "react";
import {
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/build/MaterialCommunityIcons";
import {
  PetTileItem,
  PetStars,
  resolvePetImage,
} from "./Tiles";

type PetPreviewModalProps = {
  pet: PetTileItem | null;
  visible: boolean;
  onClose: () => void;
  onPurchase: () => void;
  isPurchasing: boolean;
  purchaseError?: string | null;
};

export const PetPreviewModal = ({
  pet,
  visible,
  onClose,
  onPurchase,
  isPurchasing,
  purchaseError,
}: PetPreviewModalProps) => (
  <Modal transparent visible={visible} onRequestClose={onClose}>
    <Pressable
      onPress={onClose}
      style={{
        flex: 1,
        backgroundColor: "rgba(22, 23, 25, 0.45)",
        justifyContent: "center",
      }}
    >
      <Pressable
        style={{
          marginHorizontal: 70,
          marginVertical: 20,
          borderRadius: 24,
          backgroundColor: "#ffffff",
          overflow: "hidden",
        }}
        onPress={(event) => event.stopPropagation()}
      >
        {pet && (
          <Image
            source={resolvePetImage(pet)}
            resizeMode="cover"
            style={{ width: "100%", height: 300 }}
          />
        )}

        <View className="px-6 py-5 bg-white">
          <Text
            className="text-2xl font-rubik-extra-bold text-black-900"
            numberOfLines={1}
          >
            {pet?.name}
          </Text>
          <Text className="mt-1 text-sm font-rubik text-slate-500">
            {pet?.rarity?.toUpperCase() ?? ""} ·{" "}
            {pet?.species
              ? pet.species.charAt(0).toUpperCase() + pet.species.slice(1)
              : ""}
          </Text>
          {pet && (
            <View className="mt-2">
              <PetStars rarity={pet.rarity} />
            </View>
          )}
          {!!pet?.description && (
            <Text className="mt-3 text-sm leading-5 text-slate-600">
              {pet.description}
            </Text>
          )}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onPurchase}
            disabled={!pet || isPurchasing}
            className="mt-6 rounded-full bg-black-300 flex-row items-center justify-center"
            style={{ opacity: pet && !isPurchasing ? 1 : 0.5 }}
          >
            <View className=" h-8 w-8 items-center justify-center rounded-full bg-amber-400">
              <MaterialCommunityIcons
                name="currency-usd"
                size={18}
                color="#92400e"
              />
            </View>

            <Text className="text-white py-3 ml-2 text-2xl">
              {isPurchasing ? "..." : pet?.priceCoins.toLocaleString()}
            </Text>
          </TouchableOpacity>
          {!!purchaseError && (
            <Text className="mt-3 text-xs text-red-500">{purchaseError}</Text>
          )}
        </View>
      </Pressable>
    </Pressable>
  </Modal>
);

type InsufficientCoinsModalProps = {
  visible: boolean;
  petName?: string | null;
  onClose: () => void;
  onGetMoreCoins: () => void;
};

export const InsufficientCoinsModal = ({
  visible,
  petName,
  onClose,
  onGetMoreCoins,
}: InsufficientCoinsModalProps) => (
  <Modal
    transparent
    visible={visible}
    onRequestClose={onClose}
    animationType="fade"
  >
    <Pressable
      onPress={onClose}
      style={{
        flex: 1,
        backgroundColor: "rgba(22, 23, 25, 0.45)",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Pressable
        onPress={(event) => event.stopPropagation()}
        style={{
          width: "72%",
          borderRadius: 24,
          backgroundColor: "#ffffff",
          paddingVertical: 18,
          paddingHorizontal: 18,
        }}
      >
        <Text className="text-2xl font-rubik-extra-bold text-black-900">
          Not enough coins
        </Text>
        <Text className="mt-2 text-sm leading-5 text-slate-600">
          You need more coins to adopt {petName ?? "this pet"}.
        </Text>

        <View className="mt-4 flex-row items-center justify-between">
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
            <Text className="text-center text-base font-rubik-medium text-slate-600">
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
            <Text className="text-center text-base font-rubik-medium text-white">
              Get more coins
            </Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Pressable>
  </Modal>
);

type PurchaseSuccessModalProps = {
  visible: boolean;
  petName?: string | null;
  onClose: () => void;
  primaryButtonColor?: string;
};

export const PurchaseSuccessModal = ({
  visible,
  petName,
  onClose,
  primaryButtonColor = "#191d31",
}: PurchaseSuccessModalProps) => (
  <Modal
    transparent
    visible={visible}
    onRequestClose={onClose}
    animationType="fade"
  >
    <Pressable
      onPress={onClose}
      style={{
        flex: 1,
        backgroundColor: "rgba(22, 23, 25, 0.45)",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Pressable
        onPress={(event) => event.stopPropagation()}
        style={{
          width: "72%",
          borderRadius: 24,
          backgroundColor: "#ffffff",
          paddingVertical: 18,
          paddingHorizontal: 18,
        }}
      >
        <Text className="text-2xl font-rubik-extra-bold text-black-900">
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
            backgroundColor: primaryButtonColor,
          }}
        >
          <Text className="text-center text-base text-white">
            Back to store
          </Text>
        </TouchableOpacity>
      </Pressable>
    </Pressable>
  </Modal>
);
