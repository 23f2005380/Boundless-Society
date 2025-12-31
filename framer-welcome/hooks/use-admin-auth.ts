import { useState, useEffect } from 'react';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'; // Change this!
const ADMIN_TOKEN_KEY = 'boundless_admin_token';
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export const useAdminAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if valid token exists
        const storedToken = localStorage.getItem(ADMIN_TOKEN_KEY);
        if (storedToken) {
            try {
                const { timestamp } = JSON.parse(storedToken);
                if (Date.now() - timestamp < TOKEN_EXPIRY_MS) {
                    setIsAuthenticated(true);
                } else {
                    localStorage.removeItem(ADMIN_TOKEN_KEY);
                }
            } catch (error) {
                localStorage.removeItem(ADMIN_TOKEN_KEY);
            }
        }
        setIsLoading(false);
    }, []);

    const login = (password: string): boolean => {
        if (password === ADMIN_PASSWORD) {
            const token = JSON.stringify({
                timestamp: Date.now(),
                auth: 'admin'
            });
            localStorage.setItem(ADMIN_TOKEN_KEY, token);
            setIsAuthenticated(true);
            return true;
        }
        return false;
    };

    const logout = () => {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        setIsAuthenticated(false);
    };

    return {
        isAuthenticated,
        isLoading,
        login,
        logout
    };
};
