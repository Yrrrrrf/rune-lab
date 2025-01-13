// src/lib/stores/auth.svelte.ts
interface UserProfile {
    id: string;
    username: string;
    email: string;
    fullName: string;
    status: 'active' | 'inactive' | 'suspended';
    roles: UserRole[];
    createdAt: string;
    updatedAt: string;
}

interface UserRole {
    id: string;
    name: string;
    permissions: Record<string, boolean>;
}

import { availableThemes } from "$lib/theme/static.js";

interface UserPreferences {
	// Themes can only be one of the available themes
    theme: typeof availableThemes[number];
    language: string;
    notifications: {
        email: boolean;
        push: boolean;
    };
    settings: Record<string, unknown>;
}

class AuthStore {
    // Core state
    profile = $state<UserProfile | null>(null);
    preferences = $state<UserPreferences>({
        theme: 'system',
        language: 'en',
        notifications: { email: true, push: false },
        settings: {}
    });

    // Derived states
    isAuthenticated = $derived(!!this.profile);
    userRoles = $derived(this.profile?.roles.map(r => r.name) ?? []);
    
    // Instead of a derived method, we'll use a regular method that reads the derived state
    hasPermission(permission: string): boolean {
        return this.profile?.roles.some(role => role.permissions[permission]) ?? false;
    }

    setProfile(profile: UserProfile) {
        this.profile = profile;
		console.log('👤 User profile set:', profile);
    }

    setPreferences(preferences: UserPreferences) {
        this.preferences = preferences;
		console.log('⚙️ User preferences set:', preferences);
    }

    clearAuth() {
        this.profile = null;
		console.log('🔓 User profile cleared. Goodbye! 👋');
    }

    getUserId() {return this.profile?.id;}
}

export const authStore = new AuthStore();
