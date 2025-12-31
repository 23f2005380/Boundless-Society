'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLogin from '@/components/admin/AdminLogin';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { useAdminAuth } from '@/hooks/use-admin-auth';

export default function AdminPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading, login, logout } = useAdminAuth();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#3B001B] to-[#6d1a2c] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-lg">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <AdminLogin onLogin={login} />;
    }

    return (
        <AdminDashboard
            onLogout={() => {
                logout();
                router.push('/');
            }}
        />
    );
}
