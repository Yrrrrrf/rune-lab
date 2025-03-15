// src/lib/stores/auth.svelte.ts

export interface UserRole {
	id: string;
	name: string;
	permissions: Record<string, boolean>;
}

export interface UserProfile {
	id: string;
	username: string;
	email: string;
	fullName: string;
	status: "active" | "inactive" | "suspended";
	roles: UserRole[];
	createdAt: string;
	updatedAt: string;
}

interface UserPreferences {
	// Themes can only be one of the available themes
	theme: string; // Use string type for compatibility
	language: string;
	notifications: {
		email: boolean;
		push: boolean;
	};
	settings: Record<string, unknown>;
}

class AuthStore {
	// Core state with explicit type annotations
	profile: UserProfile | null = $state(null);
	preferences: UserPreferences = $state({
		theme: "dracula",
		language: "en",
		notifications: { email: true, push: false },
		settings: {},
	});

	// Use accessor properties for derived values
	get isAuthenticated(): boolean {
		return !!this.profile;
	}

	get userRoles(): string[] {
		return this.profile?.roles.map((r) => r.name) ?? [];
	}

	// Method that checks user permissions
	hasPermission(permission: string): boolean {
		return this.profile?.roles.some((role) => role.permissions[permission]) ?? false;
	}

	setProfile(profile: UserProfile): void {
		this.profile = profile;
		console.log("👤 User profile set:", profile);
	}

	setPreferences(preferences: UserPreferences): void {
		this.preferences = preferences;
		console.log("⚙️ User preferences set:", preferences);
	}

	clearAuth(): void {
		this.profile = null;
		console.log("🔓 User profile cleared. Goodbye! 👋");
	}

	getUserId(): string | undefined {
		return this.profile?.id;
	}
}

// Export singleton instance with explicit type
export const authStore: AuthStore = new AuthStore();
