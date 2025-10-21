import { createContext, useContext, useState, useEffect, useRef } from "react";
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
    coins: number;
    selectedPet?: string | null;
}

type BannerType = 'success' | 'error' | 'info' | 'warning';

interface GlobalContextType {
    isLoggedIn: boolean;
    userProfile: UserProfile | null;
    loading: boolean
    refetch: () => Promise<void>;
    logout: () => Promise<boolean>;
    showBanner: (message: string, type?: BannerType) => void;
    coins: number;
    updateUserProfile: (patch: Partial<UserProfile>) => void;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

const GlobalProvider = ({children}: {children: React.ReactNode}) => {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isCheckingAuth, setIsCheckingAuth] = useState(false);
    
    // Banner state
    const [bannerVisible, setBannerVisible] = useState(false);
    const [bannerMessage, setBannerMessage] = useState('');
    const [bannerType, setBannerType] = useState<BannerType>('info');

    // Fetch user profile from backend - this also serves as our auth check
    const fetchUserProfile = async () => {
        try {
            // First check if user is authenticated with Appwrite
            const currentUser = await getCurrentUser();
            
            if (!currentUser?.$id) {
                setUserProfile(null);
                setLoading(false);
                return;
            }

            // User is authenticated, fetch their full profile
            const response = await fetch(`${API_BASE_URL}/api/user/get_profile/${currentUser.$id}`);
            const data = await response.json();

            if (data.success) {
                const profile = data.data as UserProfile;
                setUserProfile({
                    ...profile,
                    coins: typeof profile.coins === "number" ? profile.coins : 0,
                });
                console.log('✅ User profile loaded:', profile);
            } else {
                console.warn('⚠️ Failed to load user profile:', data.error);
                setUserProfile(null);
            }
        } catch (error) {
            console.error('❌ Error fetching user profile:', error);
            setUserProfile(null);
        } finally {
            setLoading(false);
        }
    };

    // Refetch user profile, not sure where this is being used
    const refetch = async () => {
        setLoading(true);
        await fetchUserProfile();
    };

    const updateUserProfile = (patch: Partial<UserProfile>) => {
        setUserProfile(prev => (prev ? { ...prev, ...patch } : prev));
    };

    // Check auth and load profile on mount
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
                // Clear the user profile
                setUserProfile(null);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error during logout:', error);
            return false;
        }
    };

    const showBanner = (message: string, type: BannerType = 'info') => {
        setBannerMessage(message);
        setBannerType(type);
        setBannerVisible(true);
    };


    const isLoggedIn = !!userProfile;

    return(
        <GlobalContext.Provider value={{
            isLoggedIn,
            userProfile,
            loading,
            refetch,
            logout,
            showBanner,
            coins: userProfile?.coins || 0
            updateUserProfile,
        }}>
            <Banner
                message={bannerMessage}
                type={bannerType}
                visible={bannerVisible}
                onHide={() => setBannerVisible(false)}
                duration={3000}
            />
            {children}
        </GlobalContext.Provider>
    )
}

export const useGlobalContext = () : GlobalContextType => {
    const context = useContext(GlobalContext);

    if(!context){
        throw new Error('useGlobalContext must be used within a GlobalProvider');
    }

    return context;
}

export default GlobalProvider;
