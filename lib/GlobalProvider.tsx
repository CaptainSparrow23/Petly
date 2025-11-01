import { createContext, useContext, useState, useEffect } from "react";
import { getCurrentUser, logout as appwriteLogout } from "./appwrite";
import Constants from "expo-constants";
import { Banner } from "@/components/other/Banner";

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;

interface UserProfile {
    userId: string;
    username: string | null;
    displayName: string | null;
    email: string | null;
    profileId: number | null;
    timeActiveToday: number; 
    timeActiveTodayMinutes: number; 
    coins: number;
    ownedPets: string[];
    selectedPet: string | null;
}

type BannerType = "success" | "error" | "info" | "warning";

interface GlobalContextType {
    isLoggedIn: boolean;
    userProfile: UserProfile | null;
    loading: boolean;
    refetchUserProfile: () => Promise<void>;
    logout: () => Promise<boolean>;
    showBanner: (message: string, type?: BannerType) => void;
    updateUserProfile: (patch: Partial<UserProfile>) => void;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

const GlobalProvider = ({ children }: { children: React.ReactNode }) => {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isCheckingAuth, setIsCheckingAuth] = useState(false);
    const [bannerVisible, setBannerVisible] = useState(false);
    const [bannerMessage, setBannerMessage] = useState("");
    const [bannerType, setBannerType] = useState<BannerType>("info");

    const fetchUserProfile = async () => {
        try {
            const currentUser = await getCurrentUser();
            if (!currentUser?.$id) {
                setUserProfile(null);
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/get_user_profile/${currentUser.$id}`);
            const data = await response.json();

            if (data.success) {
                const profile = data.data as UserProfile;

                // Compute minutes (rounded down)
                const timeActiveTodayMinutes = Math.floor((profile.timeActiveToday ?? 0) / 60);

                setUserProfile({
                    ...profile,
                    timeActiveTodayMinutes,
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
    };

    //only used when we login
    const refetchUserProfile = async () => {
        setLoading(true);
        await fetchUserProfile();
    };

    const updateUserProfile = (patch: Partial<UserProfile>) => {
        setUserProfile((prev) =>
            prev ? { ...prev, ...patch } : prev
        );
    };

    useEffect(() => {
        if (!isCheckingAuth) {
            setIsCheckingAuth(true);
            fetchUserProfile();
        }
    }, []);

    const logout = async () => {
        try {
            const success = await appwriteLogout();
            if (success) {
                setUserProfile(null);
                return true;
            }
            return false;
        } catch (error) {
            console.error("Error during logout:", error);
            return false;
        }
    };

    const showBanner = (message: string, type: BannerType = "info") => {
        setBannerMessage(message);
        setBannerType(type);
        setBannerVisible(true);
    };

    const isLoggedIn = !!userProfile;

    return (
        <GlobalContext.Provider
            value={{
                isLoggedIn,
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
