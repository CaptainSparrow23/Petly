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
            let username: string | null = null;
            try {
                const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';
                const statusResponse = await fetch(`${API_BASE_URL}/api/auth/check-user-status`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userId: response.$id }),
                });

                if (statusResponse.ok) {
                    const statusResult = await statusResponse.json();
                    username = statusResult?.data?.username ?? null;
                } else {
                    console.warn('Failed to fetch user status:', statusResponse.status, statusResponse.statusText);
                }
            } catch (statusError) {
                console.error('Error fetching user status:', statusError);
            }

            return { ...response, avatar: avatarUrl, username };
        }
        return null;
    } catch (error) {
        console.log(error);
        return null;
    }


}
