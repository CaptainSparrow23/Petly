import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  Image,
  Dimensions,
  Animated,
} from "react-native";
import Rive from "rive-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { ChevronLeft, Check } from "lucide-react-native";
import { router } from "expo-router";
import { useGlobalContext } from "@/providers/GlobalProvider";
import { CoralPalette } from "@/constants/colors";
import images from "@/constants/images";
import { PET_UNLOCK_LEVELS } from "@/utils/petUnlocks";
import unlockAnimation from "@/assets/animations/unlock.riv";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const FONT = { fontFamily: "Nunito" };

// Rive unlock animation configuration – adjust if your .riv uses different names
const UNLOCK_STATE_MACHINE = "State Machine 1";
const UNLOCK_TRIGGER_INPUT = "unlock";

// Design-time normalized positions (0–1) in background image space (16:9 container, top→bottom)
// These are fractions of the map width/height, so nodes stay pinned even when screen size changes.
const NODE_POINTS: Array<{ level: number; x: number; y: number }> = [
  // Top segment
  { level: 1, x: 0.27, y: 0.345},
  { level: 2, x: 0.75, y: 0.38 },
  // Upper mid
  { level: 3, x: 0.15, y: 0.45 },
  { level: 4, x: 0.49, y: 0.48 },
  // Around the bridge / mid section
  { level: 5, x: 0.86, y: 0.52 },
  { level: 6, x: 0.19, y: 0.60},
  // Lower S curves
  { level: 7, x: 0.48, y: 0.65 },
  { level: 8, x: 0.775, y: 0.70 },
  { level: 9, x: 0.285, y: 0.8 },
]

interface RewardNode {
  level: number;
  type: "pet" | "regular";
  petId?: string;
  icon?: any;
}

export default function ProgressMap() {
  const { userProfile, showBanner, refetchUserProfile } = useGlobalContext();
  const currentLevel = userProfile?.level ?? 1;
  const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string | undefined;

  // Level progression data (same as profile page)
  const level = userProfile?.level ?? 1;
  const xpIntoLevel = userProfile?.xpIntoLevel ?? 0;
  const xpToNextLevel = userProfile?.xpToNextLevel ?? 50;
  const xpTotal = xpIntoLevel + xpToNextLevel;

  // Display semantics: when the bar is visually full, we want to show the *next* level
  // starting at 0 / next-level XP instead of "current level with a full bar".
  const MAX_LEVEL = 9;
  const xpNeededForNext = (currentLevel: number) =>
    Math.round(50 * Math.pow(currentLevel, 1.5)); // must stay in sync with backend computeLevelMeta

  let displayXpIntoLevel = xpIntoLevel;
  let displayXpTotal = xpTotal;

  const barLooksFull =
    level < MAX_LEVEL &&
    xpTotal > 0 &&
    // Treat as full if we're within ~0.5 XP of the end of the bar
    xpIntoLevel >= xpTotal - 0.5;

  if (barLooksFull) {
    const nextLevel = Math.min(level + 1, MAX_LEVEL);
    displayXpIntoLevel = 0;
    displayXpTotal = xpNeededForNext(nextLevel);
  }

  const levelProgress =
    displayXpTotal > 0 ? (displayXpIntoLevel / displayXpTotal) * 100 : 0;

  // Get next pet unlock
  const nextPetUnlock = useMemo(() => {
    const unlockLevels = [1, 3, 5, 7, 9];
    const petNames: Record<number, string> = {
      1: "Smurf",
      3: "Pebbles",
      5: "Chedrick",
      7: "Gooner",
      9: "Kitty",
    };

    for (const unlockLevel of unlockLevels) {
      if (level < unlockLevel) {
        return { level: unlockLevel, name: petNames[unlockLevel] };
      }
    }
    return null; // Max level reached
  }, [level]);

  // 16:9 vertical-ish container based on screen width
  const MAP_ASPECT = 17 / 9; // height / width
  const mapWidth = SCREEN_WIDTH;
  const mapHeight = MAP_ASPECT * mapWidth;

  // Scale normalized positions into actual pixel coordinates in the map container
  const nodePositions = useMemo(
    () =>
      NODE_POINTS.map((p) => ({
        level: p.level,
        x: p.x * mapWidth,
        y: p.y * mapHeight,
      })),
    [mapWidth, mapHeight]
  );

  // Create reward nodes
  const rewardNodes = useMemo((): RewardNode[] => {
    const nodes: RewardNode[] = [];
    
    for (let level = 1; level <= 9; level++) {
      // Level 1: smurf (pet)
      if (level === 1) {
        const petImage = images.pet_smurf;
        nodes.push({
          level,
          type: "pet",
          petId: "pet_smurf",
          icon: petImage,
        });
        continue;
      }
      
      // Level 2: laptop (gadget)
      if (level === 2) {
        nodes.push({
          level,
          type: "regular",
          icon: images.gadget_laptop,
        });
        continue;
      }
      
      // Level 3: pebbles (pet)
      if (level === 3) {
        const petImage = images.pet_pebbles;
        nodes.push({
          level,
          type: "pet",
          petId: "pet_pebbles",
          icon: petImage,
        });
        continue;
      }
      
      // Level 4: empty
      if (level === 4) {
        nodes.push({
          level,
          type: "regular",
        });
        continue;
      }
      
      // Level 5: chedrick (pet)
      if (level === 5) {
        const petImage = images.pet_chedrick;
        nodes.push({
          level,
          type: "pet",
          petId: "pet_chedrick",
          icon: petImage,
        });
        continue;
      }
      
      // Level 6: pot and stove (gadget)
      if (level === 6) {
        nodes.push({
          level,
          type: "regular",
          icon: images.gadget_pot_and_stove,
        });
        continue;
      }
      
      // Level 7: gooner (pet)
      if (level === 7) {
        const petImage = images.pet_gooner;
        nodes.push({
          level,
          type: "pet",
          petId: "pet_gooner",
          icon: petImage,
        });
        continue;
      }
      
      // Level 8: cello artisan (gadget)
      if (level === 8) {
        nodes.push({
          level,
          type: "regular",
          icon: images.gadget_cello_artisan,
        });
        continue;
      }
      
      // Level 9: kitty (pet)
      if (level === 9) {
        const petImage = images.pet_kitty;
        nodes.push({
          level,
          type: "pet",
          petId: "pet_kitty",
          icon: petImage,
        });
        continue;
      }
    }
    
    return nodes;
  }, []);

  // Track which levels have:
  // - played the unlock animation at least once (so we don't replay)
  // - are currently in the “unlocking” state (showing the Rive animation once)
  // - been explicitly claimed by the user (reward claimed)
  const [unlockingLevels, setUnlockingLevels] = useState<Record<number, boolean>>({});
  const [playedUnlock, setPlayedUnlock] = useState<Record<number, boolean>>({});
  const [claimedLevels, setClaimedLevels] = useState<Record<number, boolean>>({});
  const prevLevelRef = useRef<number | null>(null);
  const [prevLevelReady, setPrevLevelReady] = useState(false);

  // Shared bounce animation for all claimable (unclaimed & reachable) nodes
  const claimableBounce = useRef(new Animated.Value(1)).current;
  const bounceLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // One Rive ref per level so we can fire the `unlock` trigger imperatively
  const unlockRiveRefs = useRef<Record<number, any>>({});
  // Track which Rive instances are ready to receive commands
  const riveReadyRefs = useRef<Record<number, boolean>>({});
  // Track if we've initialized the input state to avoid repeated calls
  const riveInputInitialized = useRef<Record<number, boolean>>({});
  // Per-level scale for reward icon so we can pop it in after unlock
  const iconScaleByLevel = useRef<Record<number, Animated.Value>>({});
  
  // Initial pop-out animation for nodes on mount
  const nodePopScaleByLevel = useRef<Record<number, Animated.Value>>({});

  // Slide-in animations for overlays
  const focusRankSlideY = useRef(new Animated.Value(-200)).current; // Start above screen
  const legendSlideY = useRef(new Animated.Value(200)).current; // Start below screen

  // Background animation values
  const particleAnimations = useRef(
    Array.from({ length: 20 }, () => ({
      x: new Animated.Value(Math.random() * mapWidth),
      y: new Animated.Value(Math.random() * mapHeight),
      opacity: new Animated.Value(0.3 + Math.random() * 0.4),
      scale: new Animated.Value(0.5 + Math.random() * 0.5),
    }))
  ).current;


  // Animate overlays sliding in on mount
  useEffect(() => {
    // Focus Rank slides in from top
    Animated.spring(focusRankSlideY, {
      toValue: 0,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Legend slides in from bottom
    Animated.spring(legendSlideY, {
      toValue: 0,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Animate nodes popping out with staggered delays
    rewardNodes.forEach((node, index) => {
      if (!nodePopScaleByLevel.current[node.level]) {
        nodePopScaleByLevel.current[node.level] = new Animated.Value(0);
      }
      
      const delay = index * 50; // Stagger each node by 50ms
      const scaleAnim = nodePopScaleByLevel.current[node.level];
      
      setTimeout(() => {
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 40,
          friction: 6,
          useNativeDriver: true,
        }).start();
      }, delay);
    });
  }, []);

  // Start background animations on mount
  useEffect(() => {
    // Floating particles animation
    particleAnimations.forEach((particle, index) => {
      const delay = index * 200;
      const duration = 3000 + Math.random() * 2000;
      
      const xAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(particle.x, {
            toValue: Math.random() * mapWidth,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(particle.x, {
            toValue: Math.random() * mapWidth,
            duration: duration,
            useNativeDriver: true,
          }),
        ])
      );

      const yAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(particle.y, {
            toValue: Math.random() * mapHeight,
            duration: duration * 1.2,
            useNativeDriver: true,
          }),
          Animated.timing(particle.y, {
            toValue: Math.random() * mapHeight,
            duration: duration * 1.2,
            useNativeDriver: true,
          }),
        ])
      );

      const opacityAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(particle.opacity, {
            toValue: 0.2,
            duration: 2000 + Math.random() * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(particle.opacity, {
            toValue: 0.6,
            duration: 2000 + Math.random() * 1000,
            useNativeDriver: true,
          }),
        ])
      );

      setTimeout(() => {
        xAnim.start();
        yAnim.start();
        opacityAnim.start();
      }, delay);
    });

    return () => {
      particleAnimations.forEach((particle) => {
        particle.x.stopAnimation();
        particle.y.stopAnimation();
        particle.opacity.stopAnimation();
      });
    };
  }, [mapWidth, mapHeight]);


  // When the user profile changes, hydrate claimedLevels from backend state
  useEffect(() => {
    // `claimedLevelRewards` is added on the backend but may not be in the TS type yet,
    // so we access it via `any` to avoid type errors.
    const raw = (userProfile as any)?.claimedLevelRewards;
    const claimedArray: number[] = Array.isArray(raw) ? (raw as number[]) : [];

    const next: Record<number, boolean> = {};
    for (const lvl of claimedArray) {
      next[lvl] = true;
    }
    setClaimedLevels(next);
  }, [userProfile]);

  // On mount / when user changes, load last seen level so we can detect level-ups
  useEffect(() => {
    let cancelled = false;
    const loadPrevLevel = async () => {
      if (!userProfile?.userId) {
        prevLevelRef.current = currentLevel;
        if (!cancelled) setPrevLevelReady(true);
        return;
      }

      try {
        const key = `progressMap:lastLevel:${userProfile.userId}`;
        const stored = await AsyncStorage.getItem(key);
        const parsed = stored ? parseInt(stored, 10) : NaN;
        prevLevelRef.current = Number.isFinite(parsed) ? parsed : currentLevel;
      } catch {
        prevLevelRef.current = currentLevel;
      } finally {
        if (!cancelled) {
          setPrevLevelReady(true);
        }
      }
    };

    void loadPrevLevel();

    return () => {
      cancelled = true;
    };
  }, [userProfile?.userId, currentLevel]);

  useEffect(() => {
    if (!prevLevelReady) return;

    const prevLevel = prevLevelRef.current ?? currentLevel;

    NODE_POINTS.forEach(({ level }) => {
      const prevFarLocked = prevLevel + 3 <= level;
      const nowFarLocked = currentLevel + 3 <= level;
      const nowNearFuture = !nowFarLocked && currentLevel < level; // within 1–2 levels ahead

      // First frame when a node moves from far-locked (grey + unlock icon)
      // into the near-future range → trigger unlock animation once.
      if (prevFarLocked && nowNearFuture && !playedUnlock[level]) {
        console.log(
          `🎬 Triggering unlock animation for level ${level} (prevLevel: ${prevLevel}, currentLevel: ${currentLevel})`
        );
        setUnlockingLevels((prev) => ({ ...prev, [level]: true }));
        setPlayedUnlock((prev) => ({ ...prev, [level]: true }));

        // Approximate unlock animation duration; after it finishes,
        // stop showing Rive and pop in the reward icon with a bounce.
        setTimeout(() => {
          setUnlockingLevels((prev) => ({ ...prev, [level]: false }));

          const scale = iconScaleByLevel.current[level];
          if (scale) {
            scale.setValue(0);
            Animated.spring(scale, {
              toValue: 1,
              tension: 50,
              friction: 7,
              useNativeDriver: true,
            }).start();
          }
        }, 1500);
      }
    });

    prevLevelRef.current = currentLevel;

    if (userProfile?.userId) {
      const key = `progressMap:lastLevel:${userProfile.userId}`;
      AsyncStorage.setItem(key, String(currentLevel)).catch(() => {});
    }
  }, [currentLevel, playedUnlock, prevLevelReady, userProfile, claimableBounce]);

  // Start/stop a looping bounce animation for any claimable nodes
  useEffect(() => {
    const hasClaimable = rewardNodes.some(
      (node) => currentLevel >= node.level && !claimedLevels[node.level]
    );

    if (hasClaimable) {
      if (!bounceLoopRef.current) {
        claimableBounce.setValue(1);
        const loop = Animated.loop(
          Animated.sequence([
            Animated.timing(claimableBounce, {
              toValue: 1.08,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(claimableBounce, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        );
        bounceLoopRef.current = loop;
        loop.start();
      }
    } else if (bounceLoopRef.current) {
      bounceLoopRef.current.stop();
      bounceLoopRef.current = null;
      claimableBounce.setValue(1);
    }

    return () => {
      if (bounceLoopRef.current) {
        bounceLoopRef.current.stop();
        bounceLoopRef.current = null;
      }
    };
  }, [rewardNodes, currentLevel, claimedLevels, claimableBounce]);

  // Track last set value to avoid unnecessary updates
  const lastUnlockState = useRef<Record<number, boolean>>({});

  // Update Rive boolean input for nodes that have Rive components mounted and ready
  useEffect(() => {
    // Only update nodes that should have Rive components (far-locked or unlocking)
    rewardNodes.forEach((node) => {
      const isCompleted = !!claimedLevels[node.level];
      const isUnlocking = !!unlockingLevels[node.level];
      const isFarLocked = node.level >= currentLevel + 3 && !isCompleted;
      
      // Rive is only rendered when isFarLocked || isUnlocking
      if (!isFarLocked && !isUnlocking) {
        // Clean up tracking when Rive is no longer rendered
        delete lastUnlockState.current[node.level];
        return;
      }
      
      const ref = unlockRiveRefs.current[node.level];
      const isReady = riveReadyRefs.current[node.level];
      
      if (!ref || !isReady) {
        // Ref not ready yet, skip (will be set when Rive mounts and plays)
        return;
      }
      
      // Set boolean to true only when actively unlocking, false otherwise
      const shouldUnlock = isUnlocking;
      
      // Only update if the value has changed
      if (lastUnlockState.current[node.level] === shouldUnlock) {
        return;
      }
      
      try {
        ref.setInputState(UNLOCK_STATE_MACHINE, UNLOCK_TRIGGER_INPUT, shouldUnlock);
        lastUnlockState.current[node.level] = shouldUnlock;
      } catch (e) {
        // Silently ignore if Rive isn't ready yet (will retry on next render)
        console.warn(`Rive not ready for level ${node.level}, will retry`);
      }
    });
  }, [unlockingLevels, currentLevel, rewardNodes, claimedLevels]);

  return (
    <View className="flex-1" style={{ backgroundColor: CoralPalette.surface }}>
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-5 py-5 mt-16"
        style={{ backgroundColor: CoralPalette.surface }}
      >
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={30} color={CoralPalette.dark} />
        </TouchableOpacity>
        <Text
          className="text-lg"
          style={[{ color: CoralPalette.dark, fontWeight: "700", fontSize: 16 }, FONT]}
        >
          Focus Rank Rewards
        </Text>
        <View style={{ width: 27 }} />
      </View>

      {/* Map Container (16:9, centered horizontally) */}
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <View style={{ width: mapWidth, height: mapHeight, overflow: "hidden" }}>
          {/* Static Background */}
          <ImageBackground
            source={images.map_background}
            style={{
              position: "absolute",
              width: mapWidth,
              height: mapHeight,
          
            }}
            resizeMode="cover"
          />

          {/* Floating Particles */}
          {particleAnimations.map((particle, index) => (
            <Animated.View
              key={index}
              style={{
                position: "absolute",
                width: 4,
                height: 4,
                borderRadius: 2,
                backgroundColor: CoralPalette.primaryLighter || "#FFB6C1",
                transform: [
                  { translateX: particle.x },
                  { translateY: particle.y },
                  { scale: particle.scale },
                ],
                opacity: particle.opacity,
              }}
              pointerEvents="none"
            />
          ))}

          {/* Reward Nodes */}
          {rewardNodes.map((node, index) => {
            const position = nodePositions[index];
            const isUnlocked = currentLevel >= node.level;
            const nodeSize = 65; // All nodes same size
            const borderWidth = 5;
            const scaleAnim = useRef(new Animated.Value(1)).current;

            // A node is “completed” only when the user has explicitly claimed the reward.
            const isCompleted = !!claimedLevels[node.level];

            // Node is claimable if it's at or below the current level and not yet claimed.
            // (You can change this to `node.level === currentLevel` if you only want the current level claimable.)
            const isClaimable = currentLevel >= node.level && !isCompleted;

            // Nodes strictly 3+ levels ahead of the current level are “far locked”
            // and should show a grey border with the unlock icon.
            const isFarLocked = node.level >= currentLevel + 3 && !isCompleted;

            // Node is currently playing the unlock animation (just moved from far-locked to near-future).
            const isUnlocking = !!unlockingLevels[node.level];

            // Check if this is the next level node (currentLevel + 1)
            const isNextLevel = node.level === currentLevel + 1 && !isCompleted;

            // Lazily create per-level icon scale (start at 0 while locked/unlocking, 1 otherwise)
            if (!iconScaleByLevel.current[node.level]) {
              iconScaleByLevel.current[node.level] = new Animated.Value(
                isFarLocked || isUnlocking ? 0 : 1
              );
            }
            const iconScale = iconScaleByLevel.current[node.level];
            
            // Get or create initial pop scale for this node
            if (!nodePopScaleByLevel.current[node.level]) {
              nodePopScaleByLevel.current[node.level] = new Animated.Value(0);
            }
            const nodePopScale = nodePopScaleByLevel.current[node.level];

            const handlePressIn = () => {
              Animated.spring(scaleAnim, {
                toValue: 0.9,
                useNativeDriver: true,
                tension: 300,
                friction: 10,
              }).start();
            };

            const handlePressOut = () => {
              Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 300,
                friction: 10,
              }).start();
            };

            const handlePress = async () => {
              if (!isClaimable) {
                console.log(`Pressed node level ${node.level}`);
                return;
              }

              if (!userProfile?.userId || !API_BASE_URL) {
                showBanner("Unable to claim reward. Please try again later.", "error");
                return;
              }

              try {
                console.log("Claim URL", `${API_BASE_URL}/api/claim_level_reward/${userProfile.userId}`);
                const response = await fetch(
                  `${API_BASE_URL}/api/claim_level_reward/${userProfile.userId}`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ level: node.level }),
                  }
                );
                
                const payload = await response.json().catch(() => null);
                
                console.log("Claim reward response:", {
                  status: response.status,
                  ok: response.ok,
                  payload,
                });

                if (!response.ok || !payload?.success) {
                  const msg =
                    payload?.error ||
                    payload?.message ||
                    "We couldn't claim this reward. Please try again.";
                  console.error("Claim failed:", { status: response.status, payload });
                  showBanner(msg, "error");
                  return;
                }

                // Mark as claimed locally so UI updates immediately
                setClaimedLevels((prev) => ({ ...prev, [node.level]: true }));
                
                // Refetch user profile to sync claimedLevelRewards and owned lists from backend
                await refetchUserProfile?.();
                
                showBanner(`Rewards for level ${node.level} claimed!`, "success");
              } catch (err) {
                console.error("Error claiming level reward", err);
                showBanner("Something went wrong while claiming your reward.", "error");
              }
            };

            // Extra visual pop while unlock animation is playing
            const unlockScaleTransform = isUnlocking ? [{ scale: 1.15 }] : [];

            return (
              <TouchableOpacity
                key={node.level}
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={1}
                style={{
                  position: "absolute",
                  left: position.x - nodeSize / 2,
                  top: position.y - nodeSize / 2,
                  width: nodeSize,
                  alignItems: "center",
                }}
              >
                {/* Node Circle */}
                <Animated.View
                  style={{
                    width: nodeSize,
                    height: nodeSize,
                    transform: [
                      {
                        scale: isClaimable
                          ? Animated.multiply(
                              nodePopScale,
                              Animated.multiply(scaleAnim, claimableBounce)
                            )
                          : Animated.multiply(nodePopScale, scaleAnim),
                      },
                      // While unlocking, slightly enlarge the node to catch attention
                      ...unlockScaleTransform,
                    ],
                  }}
                >
                  {/* Node Circle */}
                  <Animated.View
                    style={{
                      width: nodeSize,
                      height: nodeSize,
                      borderRadius: nodeSize / 2,
                      backgroundColor: isUnlocked
                        ? CoralPalette.white
                        : CoralPalette.surfaceAlt,
                      borderWidth: borderWidth,
                      borderColor: isCompleted
                        ? CoralPalette.primaryLighter
                        : isClaimable
                        ? CoralPalette.primary
                        : isNextLevel
                        ? CoralPalette.purpleBright
                        : isFarLocked
                        ? CoralPalette.grey
                        : CoralPalette.greenLight,
                      alignItems: "center",
                      justifyContent: "center",
                      shadowColor: "#000",
                      shadowOffset: { width: 1, height: 4 },
                      shadowOpacity: 0.2,
                      shadowRadius: 1,
                    }}
                  >
                  {/* Visual priority:
                      1) Completed → tick + item icon (with reduced opacity)
                      2) Far locked (or currently unlocking) → unlock Rive
                      3) Otherwise → reward icon if any
                  */}
                  {isCompleted ? (
                    <View style={{ position: 'relative', width: nodeSize * 0.6, height: nodeSize * 0.6, alignItems: 'center', justifyContent: 'center' }}>
                      {node.icon && (
                        <Image
                          source={node.icon}
                          style={{
                            width: nodeSize * 0.6,
                            height: nodeSize * 0.6,
                            resizeMode: "contain",
                            opacity: 0.3,
                          }}
                        />
                      )}
                      <Check
                        size={nodeSize * 0.6}
                        color={CoralPalette.greenDark}
                        strokeWidth={3.5}
                        style={{
                          position: 'absolute',
                        }}
                      />
                    </View>
                  ) : isFarLocked || isUnlocking ? (
                    <Rive
                      key={`unlock-${node.level}`}
                      ref={(instance) => {
                        if (instance) {
                          unlockRiveRefs.current[node.level] = instance;
                          // Reset initialization flag when component remounts
                          delete riveInputInitialized.current[node.level];
                        } else {
                          // Clean up ref when component unmounts
                          delete unlockRiveRefs.current[node.level];
                          delete riveReadyRefs.current[node.level];
                          delete riveInputInitialized.current[node.level];
                        }
                      }}
                      onPlay={() => {
                        const level = node.level;
                        // Mark Rive as ready when it starts playing
                        riveReadyRefs.current[level] = true;
                        
                        // Only initialize input state once per mount
                        if (riveInputInitialized.current[level]) return;
                        
                        // Immediately set the boolean input once ready
                        const ref = unlockRiveRefs.current[level];
                        if (ref) {
                          try {
                            // Use current unlocking state from refs to avoid closure issues
                            const isUnlocking = !!unlockingLevels[level];
                            ref.setInputState(UNLOCK_STATE_MACHINE, UNLOCK_TRIGGER_INPUT, isUnlocking);
                            riveInputInitialized.current[level] = true;
                          } catch (e) {
                            console.warn(`Error setting Rive input on play for level ${level}`);
                          }
                        }
                      }}
                      source={unlockAnimation}
                      stateMachineName={UNLOCK_STATE_MACHINE}
                      style={{
                        width: nodeSize,
                        height: nodeSize,
                      }}
                      autoplay
                    />
                  ) : node.icon ? (
                    <Animated.Image
                      source={node.icon}
                      style={{
                        width: nodeSize * 0.55,
                        height: nodeSize * 0.55,
                        resizeMode: "contain",
                        transform: [{ scale: iconScale }],
                      }}
                    />
                  ) : null}
                  </Animated.View>
                </Animated.View>
                {/* Level number label */}
                <Text
                  style={{
                    color: CoralPalette.white,
                    fontSize: 18,
                    fontWeight: "900",
                    marginTop: 2,
                    fontFamily: "Nunito",
                  }}
                >
                  {node.level}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Focus Rank View Overlay */}
          <Animated.View
            style={{
              position: "absolute",
              top: 20,
              left: 20,
              right: 20,
              padding: 16,
              backgroundColor: CoralPalette.white,
              borderWidth: 1,
              borderColor: CoralPalette.surfaceAlt,
              borderRadius: 10,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 5,
              elevation: 10,
              transform: [{ translateY: focusRankSlideY }],
            }}
            pointerEvents="box-none"
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-col items-start">
                <Text
                  style={[{ paddingLeft: 2, color: CoralPalette.dark, fontSize: 16, fontWeight: "700" }, FONT]}
                >
                  Focus Rank
                </Text>
                <Text
                  style={[{ paddingLeft: 2, color: CoralPalette.mutedDark, fontSize: 10 }, FONT]}
                >
                  Rank up to unlock new pets and gadgets
                </Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-12 h-12 p-1 rounded-full" style={{ backgroundColor: CoralPalette.greenDark }}>
                  <Text
                    className="text-center"
                    style={[{ color: CoralPalette.white, fontSize: 26, fontWeight: "700" }, FONT]}
                  >
                    {level}
                  </Text>
                </View>
              </View>
            </View>
            
            <View
              style={{
                height: 12,
                borderRadius: 6,
                backgroundColor: CoralPalette.greenLighter,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  width: `${levelProgress}%`,
                  height: "100%",
                  backgroundColor: CoralPalette.green,
                  borderRadius: 6,
                }}
              />
            </View>
            <View className="flex-row mt-2 items-center justify-between">
              {nextPetUnlock && (
                <Text
                  className="text-xs mt-2"
                  style={[{ paddingLeft: 2, color: CoralPalette.greenDark }, FONT]}
                >
                  Unlock {nextPetUnlock.name} at level {nextPetUnlock.level}
                </Text>
              )}
              <Text
                className="text-sm"
                style={[{ color: CoralPalette.mutedDark }, FONT]}
              >
                {Math.round(displayXpIntoLevel)} / {Math.round(displayXpTotal)} XP
              </Text>
            </View>
          </Animated.View>

          {/* Legend Overlay */}
          <Animated.View
            style={{
              position: "absolute",
              bottom: 25,
              left: mapWidth / 2 - 150,
              paddingHorizontal: 16,
              paddingVertical: 10,
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              borderRadius: 12,
              flexDirection: "row",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center", 
              gap: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
              width: 300,
              transform: [{ translateY: legendSlideY }],
            }}
            pointerEvents="none"
          >
            {/* Next Level */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: CoralPalette.white,
                  borderWidth: 2.5,
                  borderColor: CoralPalette.greenLight,
                }}
              />
              <Text style={[{ fontSize: 11, color: CoralPalette.dark }, FONT]}>
                Next Level
              </Text>
            </View>

            {/* Current Level */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: CoralPalette.white,
                  borderWidth: 2.5,
                  borderColor: CoralPalette.purpleBright,
                }}
              />
              <Text style={[{ fontSize: 11, color: CoralPalette.dark }, FONT]}>
                Current Level
              </Text>
            </View>

            {/* Locked */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: CoralPalette.white,
                  borderWidth: 2.5,
                  borderColor: CoralPalette.grey,
                }}
              />
              <Text style={[{ fontSize: 11, color: CoralPalette.dark }, FONT]}>
                Locked
              </Text>
            </View>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}
