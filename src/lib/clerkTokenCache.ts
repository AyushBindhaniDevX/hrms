import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export interface TokenCache {
  getToken: (key: string) => Promise<string | undefined | null>;
  saveToken: (key: string, token: string) => Promise<void>;
  clearToken?: (key: string) => void | Promise<void>;
}

const createTokenCache = (): TokenCache => {
  return {
    async getToken(key: string): Promise<string | null> {
      try {
        if (Platform.OS === 'web') {
          if (typeof window !== 'undefined') {
            return localStorage.getItem(key);
          }
          return null;
        }
        return await SecureStore.getItemAsync(key);
      } catch (err) {
        console.error('Clerk SecureStore get item error: ', err);
        return null;
      }
    },
    async saveToken(key: string, value: string): Promise<void> {
      try {
        if (Platform.OS === 'web') {
          if (typeof window !== 'undefined') {
            localStorage.setItem(key, value);
          }
          return;
        }
        await SecureStore.setItemAsync(key, value);
      } catch (err) {
        console.error('Clerk SecureStore set item error: ', err);
      }
    },
    async clearToken(key: string): Promise<void> {
      try {
        if (Platform.OS === 'web') {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(key);
          }
          return;
        }
        await SecureStore.deleteItemAsync(key);
      } catch (err) {
        console.error('Clerk SecureStore delete item error: ', err);
      }
    },
  };
};

export const tokenCache = createTokenCache();
