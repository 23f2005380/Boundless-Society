import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoginProps {
    onLogin: (password: string) => boolean;
}

export default function AdminLogin({ onLogin }: LoginProps) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const success = onLogin(password);
            if (!success) {
                setError('Invalid password. Please try again.');
                setPassword('');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#3B001B] to-[#6d1a2c] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
            >
                <h1 className="text-3xl font-bold text-center text-[#3B001B] mb-2">
                    Admin Portal
                </h1>
                <p className="text-center text-gray-600 mb-8">
                    Boundless Society Administration
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Admin Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter admin password"
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#3B001B] transition"
                            disabled={isLoading}
                        />
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-red-50 border-l-4 border-red-500 p-4 rounded"
                            >
                                <p className="text-red-700 text-sm">{error}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        type="submit"
                        disabled={isLoading || !password}
                        className="w-full bg-[#3B001B] text-white font-bold py-3 rounded-lg hover:bg-[#6d1a2c] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <p className="text-center text-gray-500 text-xs mt-6">
                    For authorized administrators only
                </p>
            </motion.div>
        </div>
    );
}
