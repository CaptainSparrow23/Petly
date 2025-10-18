import { createContext, useContext, useState, useEffect } from "react";
import { getCurrentUser, logout as appwriteLogout } from "./appwrite";
import { useAppwrite } from "./useAppWrite";
import AsyncStorage from '@react-native-async-storage/async-storage';


interface User {
    $id:string;
    name: string;
    email: string;
    avatar: string;
}


interface GlobalContextType {
    isLoggedIn: boolean;
    user: User | null;
    loading: boolean
    refetch: (newParams?: Record<string, string | number>) => Promise<void>;
    selectedPetName: string | null;
    setSelectedPetName: (name: string | null) => Promise<void>;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

const GlobalProvider = ({children}: {children: React.ReactNode}) => {
    const [selectedPetName, setSelectedPetNameState] = useState<string | null>(null);

    const { data: user, loading,refetch}= useAppwrite ({
        fn: getCurrentUser,


    })

    // Sync pet preference to backend (non-blocking)
    const syncPetPreferenceToBackend = async (petName: string | null) => {
        if (!user?.$id || !petName) return;

        try {
            const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';
            await fetch(`${API_BASE_URL}/api/account/pet-preference`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.$id,
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
        if (!user?.$id) return;

        try {
            const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';
            const response = await fetch(`${API_BASE_URL}/api/account/pet-preference/${user.$id}`);
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

    // Sync with backend when user logs in
    useEffect(() => {
        if (user?.$id) {
            loadPetPreferenceFromBackend();
            retryPendingSyncs();
        }
    }, [user?.$id]);

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
                // Clear the user data by refetching (which will return null)
                await refetch();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error during logout:', error);
            return false;
        }
    };

    const isLoggedIn = !!user;
    //!null = true, !true = false
    //!!null = false, !!true = true

    console.log(JSON.stringify(user, null, 2));

    return(
        <GlobalContext.Provider value={{
            isLoggedIn,
            user,
            loading,
            refetch,
            selectedPetName,
            setSelectedPetName,
            logout,
        }}>
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
