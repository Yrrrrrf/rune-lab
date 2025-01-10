// src/lib/stores/auth.svelte.ts

export interface User {
		id: string;
		name: string;
		email: string;
		role: 'admin' | 'staff' | 'user';
	}

export interface AuthState {
	isAuthenticated: boolean;
	user: User | null;
}

class AuthStore {
	isAuthenticated = $state(false);
	user = $state<User | null>(null);

	login(user: User) {
		this.isAuthenticated = true;
		this.user = user;
		console.log('🔐 User logged in:', user);
	}

	logout() {
		this.isAuthenticated = false;
		this.user = null;
		console.log('👋 User logged out');
	}

	init(initialState?: Partial<AuthState>) {
		if (initialState?.isAuthenticated) this.isAuthenticated = initialState.isAuthenticated;
		if (initialState?.user) this.user = initialState.user;

		console.log('🔑 Auth initialized:', {
			isAuthenticated: this.isAuthenticated,
			user: this.user
		});
	}
}

export const authStore = new AuthStore();