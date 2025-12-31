'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminService, CityData } from '@/lib/admin/adminService';

export default function AdminCityManager() {
    const [cities, setCities] = useState<CityData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCity, setEditingCity] = useState<CityData | null>(null);
    const [formData, setFormData] = useState<CityData>({
        name: '',
        lat: 0,
        lng: 0,
        type: 'meetup',
        description: ''
    });

    useEffect(() => {
        loadCities();
    }, []);

    const loadCities = async () => {
        try {
            setIsLoading(true);
            const data = await AdminService.getCities();
            setCities(data);
            setError('');
        } catch (err) {
            setError('Failed to load cities');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (city?: CityData) => {
        if (city) {
            setEditingCity(city);
            setFormData(city);
        } else {
            setEditingCity(null);
            setFormData({
                name: '',
                lat: 0,
                lng: 0,
                type: 'meetup',
                description: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCity(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCity?.id) {
                await AdminService.updateCity(editingCity.id, formData);
            } else {
                await AdminService.addCity(formData);
            }
            await loadCities();
            handleCloseModal();
        } catch (err) {
            setError('Failed to save city');
            console.error(err);
        }
    };

    const handleDelete = async (cityId: string) => {
        if (!confirm('Are you sure you want to delete this city?')) return;
        try {
            await AdminService.deleteCity(cityId);
            await loadCities();
        } catch (err) {
            setError('Failed to delete city');
            console.error(err);
        }
    };

    if (isLoading) {
        return <div className="text-center py-12">Loading cities...</div>;
    }

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Cities & Trips</h2>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-[#3B001B] text-white px-6 py-2 rounded-lg hover:bg-[#6d1a2c] transition font-semibold"
                >
                    + Add New City
                </button>
            </div>

            {/* Cities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {cities.map((city) => (
                        <motion.div
                            key={city.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{city.name}</h3>
                                    <span
                                        className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                                            city.type === 'meetup'
                                                ? 'bg-orange-100 text-orange-800'
                                                : 'bg-green-100 text-green-800'
                                        }`}
                                    >
                                        {city.type === 'meetup' ? '📍 Meetup' : '🚀 Trip'}
                                    </span>
                                </div>
                            </div>

                            <p className="text-gray-600 text-sm mb-4">{city.description}</p>

                            <div className="space-y-2 text-sm mb-4">
                                <p className="text-gray-700">
                                    <span className="font-semibold">Location:</span> {city.lat.toFixed(4)}, {city.lng.toFixed(4)}
                                </p>
                                <p className="text-gray-700">
                                    <span className="font-semibold">Registrations:</span> {city.registrations || 0}
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleOpenModal(city)}
                                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition text-sm font-semibold"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(city.id || '')}
                                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition text-sm font-semibold"
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md"
                        >
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">
                                {editingCity ? 'Edit City' : 'Add New City'}
                            </h3>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        City Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#3B001B]"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Latitude
                                        </label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            value={formData.lat}
                                            onChange={(e) => setFormData({ ...formData, lat: parseFloat(e.target.value) })}
                                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#3B001B]"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Longitude
                                        </label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            value={formData.lng}
                                            onChange={(e) => setFormData({ ...formData, lng: parseFloat(e.target.value) })}
                                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#3B001B]"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Type
                                    </label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as 'meetup' | 'trip' })}
                                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#3B001B]"
                                    >
                                        <option value="meetup">City Meetup</option>
                                        <option value="trip">Trip</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#3B001B]"
                                        required
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="flex-1 bg-gray-300 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-400 transition font-semibold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-[#3B001B] text-white px-4 py-2 rounded-lg hover:bg-[#6d1a2c] transition font-semibold"
                                    >
                                        {editingCity ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
