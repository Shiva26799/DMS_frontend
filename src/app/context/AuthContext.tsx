import React, { createContext, useContext, useState, useEffect } from "react";
import { useProfileQuery } from "../hooks/auth/useProfileQuery";

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    loading: boolean;
    isAdmin: boolean;
    isDealer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to decode JWT payload without external libraries
const decodeToken = (token: string) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
    const [user, setUser] = useState<User | null>(null);
    
    // Immediate role flags from local decoding (Hybrid part 1)
    const [role, setRole] = useState<string | null>(() => {
        if (token) {
            const decoded = decodeToken(token);
            return decoded?.role || null;
        }
        return null;
    });

    // Background session verification (Hybrid part 2 - now with Caching)
    const { data: serverUser, isLoading, isError } = useProfileQuery(token);

    useEffect(() => {
        if (serverUser) {
            setUser(serverUser);
            setRole(serverUser.role);
        }
    }, [serverUser]);

    useEffect(() => {
        if (isError) {
            logout();
        }
    }, [isError]);

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem("token", newToken);
        setToken(newToken);
        setUser(newUser);
        setRole(newUser.role);
    };

    const logout = () => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        setRole(null);
    };

    const isAdmin = role === "Admin";
    const isDealer = role === "Dealer";

    // A robust loading state: if we have a token but no user yet, and no error, we are still authenticating
    const isInitialLoading = !!token && !user && !isError;

    return (
        <AuthContext.Provider value={{ 
            user, 
            token, 
            login, 
            logout, 
            loading: isInitialLoading, 
            isAdmin,
            isDealer
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
