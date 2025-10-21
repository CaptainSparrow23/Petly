import { createContext, useContext, useState, useEffect } from "react";
import { getCurrentUser, logout as appwriteLogout } from "./appwrite";
import AsyncStorage from '@react-native-async-storage/async-storage';
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
}

type BannerType = 'success' | 'error' | 'info' | 'warning';

interface GlobalContextType {
    isLoggedIn: boolean;
    userProfile: UserProfile | null;
    loading: boolean
    refetch: () => Promise<void>;
    selectedPetName: string | null;
    setSelectedPetName: (name: string | null) => Promise<void>;
    logout: () => Promise<boolean>;
    showBanner: (message: string, type?: BannerType) => void;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

const GlobalProvider = ({children}: {children: React.ReactNode}) => {
    const [selectedPetName, setSelectedPetNameState] = useState<string | null>(null);
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
                setUserProfile(data.data);
                console.log('✅ User profile loaded:', data.data);
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

    // Refetch user profile
    const refetch = async () => {
        setLoading(true);
        await fetchUserProfile();
    };

    // Check auth and load profile on mount
    useEffect(() => {
        if (!isCheckingAuth) {
            setIsCheckingAuth(true);
            fetchUserProfile();
        }
    }, []);

    // Sync pet preference to backend (non-blocking)
    const syncPetPreferenceToBackend = async (petName: string | null) => {
        if (!userProfile?.userId || !petName) return;

        try {
            const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';
            await fetch(`${API_BASE_URL}/api/account/pet-preference`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userProfile.userId,
                    selectedPet: petName
                })
            });
            console.log(`🐾 Synced pet preference to backend: ${petName}`);
        } catch (error) {
            console.error('Failed to sync pet preference to backend:', error);
            // Store for retry later
            await AsyncStorage.setItem('pendingPetSync', petName);
        }
    };

    // Load pet preference from backend on app start
    const loadPetPreferenceFromBackend = async () => {
        if (!userProfile?.userId) return;

        try {
            const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';
            const response = await fetch(`${API_BASE_URL}/api/account/pet-preference/${userProfile.userId}`);
            const data = await response.json();

            if (data.success && data.selectedPet) {
                // Update local storage and state
                await AsyncStorage.setItem('selectedPetName', data.selectedPet);
                setSelectedPetNameState(data.selectedPet);
                console.log(`🐾 Loaded pet preference from backend: ${data.selectedPet}`);
            }
        } catch (error) {
            console.error('Failed to load pet preference from backend:', error);
            // Continue with local storage
        }
    };

    // Retry pending syncs
    const retryPendingSyncs = async () => {
        try {
            const pendingPet = await AsyncStorage.getItem('pendingPetSync');
            if (pendingPet) {
                await syncPetPreferenceToBackend(pendingPet);
                await AsyncStorage.removeItem('pendingPetSync');
            }
        } catch (error) {
            console.error('Failed to retry pending syncs:', error);
        }
    };

    useEffect(() => {
        const loadSelectedPet = async () => {
            try {
                const storedPet = await AsyncStorage.getItem('selectedPetName');
                if (storedPet) {
                    setSelectedPetNameState(storedPet);
                } else {
                    setSelectedPetNameState('Skye'); // default
                }
            } catch (error) {
                console.error('Error loading selected pet:', error);
                setSelectedPetNameState('Skye');
            }
        };
        loadSelectedPet();
    }, []);

    // Sync with backend when userProfile is loaded
    useEffect(() => {
        if (userProfile?.userId) {
            loadPetPreferenceFromBackend();
            retryPendingSyncs();
        }
    }, [userProfile?.userId]);

    const setSelectedPetName = async (name: string | null) => {
        setSelectedPetNameState(name);
        try {
            if (name) {
                await AsyncStorage.setItem('selectedPetName', name);
            } else {
                await AsyncStorage.removeItem('selectedPetName');
            }
            // Sync to backend in background (non-blocking)
            syncPetPreferenceToBackend(name);
        } catch (error) {
            console.error('Error saving selected pet:', error);
        }
    };

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
            selectedPetName,
            setSelectedPetName,
            logout,
            showBanner,
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
