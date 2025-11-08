import { createContext, useContext, useState, useEffect, useCallback } from "react";
import Constants from "expo-constants";
import { Banner } from "@/components/other/Banner";
import { auth } from "@/utils/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { signOutFromFirebase } from "./firebaseAuth";

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;

interface UserProfile {
    userId: string;
    username: string | null;
    displayName: string | null;
    email: string | null;
    profileId: number | null;
    timeActiveToday: number; 
    timeActiveTodayMinutes: number;
    minutesByHour: number[]; // 24-element array for hourly chart
    coins: number;
    ownedPets: string[];
    selectedPet: string | null;
}

type BannerType = "success" | "error" | "info" | "warning";

interface GlobalContextType {
    isLoggedIn: boolean;
    authUser: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    refetchUserProfile: () => Promise<void>;
    logout: () => Promise<boolean>;
    showBanner: (message: string, type?: BannerType) => void;
    updateUserProfile: (patch: Partial<UserProfile>) => void;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

const GlobalProvider = ({ children }: { children: React.ReactNode }) => {
    const [authUser, setAuthUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [bannerVisible, setBannerVisible] = useState(false);
    const [bannerMessage, setBannerMessage] = useState("");
    const [bannerType, setBannerType] = useState<BannerType>("info");

    const fetchUserProfile = useCallback(async (userId?: string) => {
        try {
            const targetUserId = userId ?? auth.currentUser?.uid;
            if (!targetUserId) {
                setUserProfile(null);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/get_user_profile/${targetUserId}`);
            const data = await response.json();

            if (data.success) {
                const profile = data.data as UserProfile;

                // Compute minutes (rounded down)
                const timeActiveTodayMinutes = Math.floor((profile.timeActiveToday ?? 0) / 60);

                setUserProfile({
                    ...profile,
                    timeActiveTodayMinutes,
                    minutesByHour: Array.isArray(profile.minutesByHour) ? profile.minutesByHour : Array(24).fill(0),
                    coins: typeof profile.coins === "number" ? profile.coins : 0,
                    ownedPets: Array.isArray(profile.ownedPets) ? profile.ownedPets : ["pet_skye"],
                });

                console.log("✅ User profile loaded:", profile);
            } else {
                console.warn("⚠️ Failed to load user profile:", data.error);
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
        setLoading(true);
        await fetchUserProfile(authUser?.uid);
    }, [authUser?.uid, fetchUserProfile]);

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

    const showBanner = useCallback((message: string, type: BannerType = "info") => {
        setBannerMessage(message);
        setBannerType(type);
        setBannerVisible(true);
    }, []);

    const isLoggedIn = !!userProfile;

    return (
        <GlobalContext.Provider
            value={{
                isLoggedIn,
                authUser,
                userProfile,
                loading,
                refetchUserProfile,
                logout,
                showBanner,
                updateUserProfile,
            }}
        >
            <Banner
                message={bannerMessage}
                type={bannerType}
                visible={bannerVisible}
                onHide={() => setBannerVisible(false)}
                duration={3000}
            />
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
