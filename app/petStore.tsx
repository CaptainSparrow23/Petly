import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Constants from "expo-constants";
import { ChevronLeft } from "lucide-react-native";
import { CoralPalette } from "@/constants/colors";
import { useGlobalContext } from "@/providers/GlobalProvider";
import PetStoreTile from "@/components/pets/PetStoreTile";
import KeyBadge from "@/components/other/KeyBadge";

const FONT = { fontFamily: "Nunito" };
const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;

type StoreCatalogEntry = {
  id: string;
  category?: string;
  name?: string;
  priceKeys?: number;
};

type PetStoreRowItem =
  | StoreCatalogEntry
  | { id: string; __spacer: true };

export default function PetStorePage() {
  const insets = useSafeAreaInsets();
  const { userProfile, updateUserProfile, showBanner } = useGlobalContext();
  const [catalog, setCatalog] = useState<StoreCatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/store/catalog`, { signal: controller.signal });
        const json = await response.json();
        if (response.ok && json?.success && Array.isArray(json?.data)) {
          setCatalog(json.data as StoreCatalogEntry[]);
          setLoadError(false);
          return;
        }
        setLoadError(true);
      } catch {
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };

    void load();
    return () => controller.abort();
  }, []);

  const unownedPets = useMemo(() => {
    const owned = new Set(userProfile?.ownedPets ?? []);
    return catalog.filter((item) => item.category === "Pet" && !owned.has(item.id));
  }, [catalog, userProfile?.ownedPets]);

  const paddedPets = useMemo((): PetStoreRowItem[] => {
    const base: PetStoreRowItem[] = [...unownedPets];
    if (base.length % 2 === 1) {
      base.push({ id: "__spacer__", __spacer: true });
    }
    return base;
  }, [unownedPets]);

  const handlePurchase = useCallback(
    (pet: StoreCatalogEntry) => {
      if (!userProfile?.userId) return;
      const priceKeys = typeof pet.priceKeys === "number" ? pet.priceKeys : 1;
      const currentKeys = userProfile.petKey ?? 0;

      if (currentKeys < priceKeys) {
        showBanner("Not enough keys.", "error");
        return;
      }

      Alert.alert(
        "Adopt Pet",
        `Spend ${priceKeys} key${priceKeys === 1 ? "" : "s"} to adopt ${pet.name ?? "this pet"}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Confirm",
            onPress: async () => {
              try {
                setPurchasingId(pet.id);
                const response = await fetch(`${API_BASE_URL}/api/store/purchase/${userProfile.userId}`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ petId: pet.id }),
                });
                const payload = await response.json().catch(() => null);
                if (!response.ok || !payload?.success) {
                  throw new Error(payload?.error || payload?.message || "Purchase failed");
                }

                updateUserProfile({
                  petKey: Math.max(0, (userProfile.petKey ?? 0) - priceKeys),
                  ownedPets: Array.from(new Set([...(userProfile.ownedPets ?? []), pet.id])),
                });
                showBanner("Pet adopted!", "success");
              } catch (err) {
                const message = err instanceof Error ? err.message : "Purchase failed.";
                showBanner(message, "error");
              } finally {
                setPurchasingId(null);
              }
            },
          },
        ]
      );
    },
    [showBanner, updateUserProfile, userProfile]
  );

  return (
    <View style={{ flex: 1, backgroundColor: CoralPalette.beigeSoft }}>
      <View
        style={{
          backgroundColor: CoralPalette.primaryMuted,
          paddingTop: insets.top + 5,
          paddingBottom: 16,
          paddingHorizontal: 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "rgba(255,255,255,0.2)",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <ChevronLeft size={24} color={CoralPalette.white} />
            </TouchableOpacity>
            <Text style={[FONT, { fontSize: 20, fontWeight: "900", color: CoralPalette.white }]}>Pet Store</Text>
          </View>

          <KeyBadge variant="inline" />
        </View>

      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={CoralPalette.primary} />
        </View>
      ) : loadError ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
          <Text style={[FONT, { fontSize: 16, fontWeight: "800", color: CoralPalette.dark }]}>
            Couldn’t load the pet store.
          </Text>
          <Text style={[FONT, { marginTop: 6, fontSize: 13, color: CoralPalette.mutedDark, textAlign: "center" }]}>
            Check your connection and try again.
          </Text>
        </View>
      ) : unownedPets.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
          <Text style={[FONT, { fontSize: 16, fontWeight: "800", color: CoralPalette.dark }]}>
            You own all available pets.
          </Text>
          <Text style={[FONT, { marginTop: 6, fontSize: 13, color: CoralPalette.mutedDark, textAlign: "center" }]}>
            More pets coming soon.
          </Text>
        </View>
      ) : (
        <FlatList
          data={paddedPets}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ padding: 20, gap: 20 }}
          ListHeaderComponent={
            <Text
              style={[
                FONT,
                { marginTop: -10, marginBottom: -10, fontSize: 12, fontWeight: "600", color: CoralPalette.greyDark },
              ]}
            >
              Discover our full pet collection
            </Text>
          }
          renderItem={({ item }) => (
            <View style={{ flex: 1 }}>
              {"__spacer" in item ? null : (
              <PetStoreTile
                petId={item.id}
                name={item.name ?? item.id}
                priceKeys={item.priceKeys}
                onPress={purchasingId ? undefined : () => handlePurchase(item)}
              />
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}
