import { createContext, useContext, useState, useEffect, useCallback } from "react";
import Constants from "expo-constants";
import { auth } from "@/utils/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { signOutFromFirebase } from "./firebaseAuth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { toast } from "burnt";

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;
console.log("[GlobalProvider] API_BASE_URL:", API_BASE_URL);

const toNumber = (value: unknown, fallback = 0) => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

interface UserProfile {
    userId: string;
    username: string | null;
    displayName: string | null;
    email: string | null;
    profileId: number | null;
    allowFriendRequests: boolean;
    timeActiveToday: number; 
    timeActiveTodayMinutes: number;
    minutesByHour: number[]; // 24-element array for hourly chart
    coins: number;
    ownedPets: string[];
    ownedHats: string[];
    ownedFaces: string[];
    ownedCollars: string[];
    ownedGadgets: string[];
    selectedPet: string | null;
    selectedHat: string | null;
    selectedFace: string | null;
    selectedCollar: string | null;
    selectedGadget: string | null;
    dailyStreak: number;
    highestStreak: number;
    totalFocusSeconds: number;
    lastDailyGoalClaim: string | null;
    lastWeeklyGoalClaim: string | null;
}

type BannerType = "success" | "error" | "info" | "warning";

type BannerOptions = {
    title: string;
    preset?: "done" | "error" | "none";
    message?: string;
    haptic?: "success" | "warning" | "error" | "none";
};

type AppSettings = {
    keepScreenOn: boolean;
    extendSessionLimit: boolean;
    displayFocusInHours: boolean;
    vibrations: boolean;
    notifications: boolean;
};

const DEFAULT_APP_SETTINGS: AppSettings = {
    keepScreenOn: false,
    extendSessionLimit: false,
    displayFocusInHours: false,
    vibrations: true,
    notifications: true,
};

const SETTINGS_STORAGE_KEY = "petly_app_settings";

interface GlobalContextType {
    isLoggedIn: boolean;
    authUser: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    appSettings: AppSettings;
    updateAppSettings: (patch: Partial<AppSettings>) => void;
    refetchUserProfile: () => Promise<void>;
    logout: () => Promise<boolean>;
    showBanner: (
        messageOrOptions: string | BannerOptions,
        type?: BannerType
    ) => void;
    updateUserProfile: (patch: Partial<UserProfile>) => void;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

const GlobalProvider = ({ children }: { children: React.ReactNode }) => {
    const [authUser, setAuthUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored) as Partial<AppSettings>;
                    setAppSettings({ ...DEFAULT_APP_SETTINGS, ...parsed });
                }
            } catch (error) {
                console.error("Failed to load app settings", error);
            }
        };
        void loadSettings();
    }, []);

    const updateAppSettings = useCallback((patch: Partial<AppSettings>) => {
        setAppSettings((prev) => {
            const next = { ...prev, ...patch };
            AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next)).catch((err) =>
                console.error("Failed to save app settings", err)
            );
            return next;
        });
    }, []);

    const fetchUserProfile = useCallback(async (userId?: string) => {
        try {
            const targetUserId = userId ?? auth.currentUser?.uid;
            if (!targetUserId) {
                console.warn("⚠️ No user ID available for profile fetch");
                setUserProfile(null);
                setLoading(false);
                return;
            }

            // Get user's timezone
            const tzOffset = new Date().getTimezoneOffset();
            const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/London';
            
            console.log(`📍 Fetching profile for user: ${targetUserId}, TZ: ${tzName} (offset: ${tzOffset})`);
            const response = await fetch(`${API_BASE_URL}/api/get_user_profile/${targetUserId}?tz=${encodeURIComponent(tzName)}`);
            
            if (!response.ok) {
                console.error(`❌ HTTP Error: ${response.status}`);
                setUserProfile(null);
                setLoading(false);
                return;
            }

            const data = await response.json();
            console.log("📦 Backend response:", data);

            if (data.success && data.data) {
                const profile = data.data as Partial<UserProfile>;

                // Compute minutes (rounded down) - note: backend returns timeActiveToday in SECONDS
                const timeActiveTodayValue = toNumber(profile.timeActiveToday);
                const timeActiveTodayMinutes = Math.floor(timeActiveTodayValue / 60);

                const updatedProfile = {
                    ...profile,
                    timeActiveToday: timeActiveTodayValue,
                    timeActiveTodayMinutes,
                    minutesByHour: Array.isArray(profile.minutesByHour) ? profile.minutesByHour : Array(24).fill(0),
                    coins: toNumber(profile.coins),
                    ownedPets: Array.isArray(profile.ownedPets) ? profile.ownedPets : ["pet_smurf"],
                    ownedHats: Array.isArray(profile.ownedHats) ? profile.ownedHats : [],
                    ownedFaces: Array.isArray(profile.ownedFaces) ? profile.ownedFaces : [],
                    ownedCollars: Array.isArray(profile.ownedCollars) ? profile.ownedCollars : [],
                    ownedGadgets: Array.isArray(profile.ownedGadgets) ? profile.ownedGadgets : ["gadget_laptop"],
                    selectedHat: profile.selectedHat ?? null,
                    selectedFace: profile.selectedFace ?? null,
                    selectedCollar: profile.selectedCollar ?? null,
                    selectedGadget: profile.selectedGadget ?? "gadget_laptop",
                    allowFriendRequests: typeof profile.allowFriendRequests === "boolean"
                        ? profile.allowFriendRequests
                        : true,
                    dailyStreak: toNumber(profile.dailyStreak),
                    highestStreak: toNumber(profile.highestStreak),
                    totalFocusSeconds: toNumber(profile.totalFocusSeconds),
                    lastDailyGoalClaim: profile.lastDailyGoalClaim ?? null,
                    lastWeeklyGoalClaim: profile.lastWeeklyGoalClaim ?? null,
                } as UserProfile;

                setUserProfile(updatedProfile);
                console.log("✅ User profile updated:", updatedProfile);
            } else {
                console.warn("⚠️ Failed to load user profile:", data.error || "No data returned");
                setUserProfile(null);
            }
        } catch (error) {
            console.error("❌ Error fetching user profile:", error);
            setUserProfile(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setAuthUser(user);
            if (!user) {
                setUserProfile(null);
                setLoading(false);
                return;
            }
            setLoading(true);
            fetchUserProfile(user.uid);
        });

        return unsubscribe;
    }, [fetchUserProfile]);

    const refetchUserProfile = useCallback(async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            console.warn("⚠️ No authenticated user for refetch");
            return;
        }
        setLoading(true);
        await fetchUserProfile(currentUser.uid);
    }, [fetchUserProfile]);

    const updateUserProfile = useCallback((patch: Partial<UserProfile>) => {
        setUserProfile((prev) =>
            prev ? { ...prev, ...patch } : prev
        );
    }, []);

    const logout = useCallback(async () => {
        try {
            await signOutFromFirebase();
            setUserProfile(null);
            setAuthUser(null);
            return true;
        } catch (error) {
            console.error("Error during logout:", error);
            return false;
        }
    }, []);

    const showBanner = useCallback((
        messageOrOptions: string | BannerOptions,
        type: BannerType = "info"
    ) => {
        const presetMap: Record<BannerType, "done" | "error" | "none"> = {
            success: "done",
            error: "error",
            warning: "none",
            info: "none",
        };

        const baseOptions: BannerOptions =
            typeof messageOrOptions === "string"
                ? { title: messageOrOptions, preset: presetMap[type] }
                : messageOrOptions;

        // Respect vibrations setting - disable haptics if vibrations are off
        const hapticValue = appSettings.vibrations ? baseOptions.haptic : "none";

        Promise.resolve(
            toast({
                title: baseOptions.title,
                preset: baseOptions.preset ?? presetMap[type] ?? "none",
                message: baseOptions.message,
                haptic: hapticValue,
                duration: 3,
            })
        ).catch((error: unknown) => {
            console.warn("Failed to show Burnt toast", error);
        });
    }, [appSettings.vibrations]);

    const isLoggedIn = !!userProfile;

    return (
        <GlobalContext.Provider
            value={{
                isLoggedIn,
                authUser,
                userProfile,
                loading,
                appSettings,
                updateAppSettings,
                refetchUserProfile,
                logout,
                showBanner,
                updateUserProfile,
            }}
        >
            {children}
        </GlobalContext.Provider>
    );
};

export const useGlobalContext = (): GlobalContextType => {
    const context = useContext(GlobalContext);
    if (!context) {
        throw new Error("useGlobalContext must be used within a GlobalProvider");
    }
    return context;
};

export default GlobalProvider;
