'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminCityManager from './AdminCityManager';
import AdminFormManager from './AdminFormManager';
import AdminSubmissionsViewer from './AdminSubmissionsViewer';

type TabType = 'cities' | 'forms' | 'submissions';

interface AdminDashboardProps {
    onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
    const [activeTab, setActiveTab] = useState<TabType>('cities');

    const tabs = [
        { id: 'cities', label: 'Cities & Trips', icon: '📍' },
        { id: 'forms', label: 'Forms Config', icon: '📋' },
        { id: 'submissions', label: 'Submissions', icon: '📊' }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-[#3B001B]">
                            Admin Dashboard
                        </h1>
                        <p className="text-gray-600 text-sm mt-1">
                            Boundless Society Management
                        </p>
                    </div>
                    <button
                        onClick={onLogout}
                        className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition font-semibold"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4">
                    <nav className="flex gap-8">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as TabType)}
                                className={`py-4 px-2 font-semibold border-b-2 transition ${
                                    activeTab === tab.id
                                        ? 'border-[#3B001B] text-[#3B001B]'
                                        : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <span className="mr-2">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto p-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {activeTab === 'cities' && <AdminCityManager />}
                        {activeTab === 'forms' && <AdminFormManager />}
                        {activeTab === 'submissions' && <AdminSubmissionsViewer />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
