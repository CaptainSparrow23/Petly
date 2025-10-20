import * as Linking from 'expo-linking';
import { openAuthSessionAsync } from 'expo-web-browser';
import { Account, Avatars, Client, Databases, OAuthProvider } from 'react-native-appwrite';



export const config = {
    platform: 'com.petly',
    endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
    projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
}

export const client = new Client();

client
    .setEndpoint(config.endpoint!)
    .setProject(config.projectId!)
    .setPlatform(config.platform!);


export const avatar = new Avatars(client);
export const account = new Account(client);
export const databases = new Databases(client);

export async function login() {
    try {
        const redirectUri = Linking.createURL('/');

        const response = await account.createOAuth2Token(OAuthProvider.Google, redirectUri);

        if (!response) throw new Error('Failed to login');

        const browserResult = await openAuthSessionAsync(
            response.toString(),
            redirectUri
        ); 
        if (browserResult.type !== 'success') throw new Error('Failed to login');

        const url = new URL(browserResult.url);
        const secret = url.searchParams.get('secret')?.toString();
        const userId = url.searchParams.get('userId')?.toString();

        if (!secret || !userId) throw new Error('Failed to login');

        const session = await account.createSession(userId, secret);
        if (!session) throw new Error('Failed to create session');

        return true;


    } catch (error) {
        console.log(error);
        return false
    }
}

export async function logout() {
    try {
        await account.deleteSession('current');
        return true;
    } catch (error) {
        console.log(error);

        return false
    }
}

export async function getCurrentUser() {
    try {
        const response = await account.get();
        if (response.$id) {
            const avatarUrl = `${config.endpoint}/avatars/initials?name=${encodeURIComponent(response.name)}&width=400&height=400`;
            
            // Return basic user info - username will be fetched via userProfile in global provider
            return { ...response, avatar: avatarUrl, username: null };
        }
        return null;
    } catch (error) {
        // Don't log error if user is simply not authenticated (expected behavior)
        // Only log if it's an unexpected error
        if (error && typeof error === 'object' && 'type' in error && error.type !== 'general_unauthorized_scope') {
            console.error('Unexpected error in getCurrentUser:', error);
        }
        return null;
    }
}
