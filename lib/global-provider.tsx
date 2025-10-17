import { createContext, useContext, useState, useEffect } from "react";
import { getCurrentUser } from "./appwrite";
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

    const setSelectedPetName = async (name: string | null) => {
        setSelectedPetNameState(name);
        try {
            if (name) {
                await AsyncStorage.setItem('selectedPetName', name);
            } else {
                await AsyncStorage.removeItem('selectedPetName');
            }
        } catch (error) {
            console.error('Error saving selected pet:', error);
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
