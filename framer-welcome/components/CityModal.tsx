'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { AdminService, FormConfig, FormField } from '@/lib/admin/adminService';

interface City {
    name: string;
    shortName?: string;
    lat: number;
    lng: number;
    type: 'meetup' | 'trip';
}

interface CityModalProps {
    city: City;
    isOpen: boolean;
    onClose: () => void;
}

export default function CityModal({ city, isOpen, onClose }: CityModalProps) {
    const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Fetch form configuration when modal opens
    useEffect(() => {
        const loadFormConfig = async () => {
            try {
                setIsLoading(true);
                const configs = await AdminService.getFormConfigs();
                
                // Find the appropriate form config based on city type
                const formType = city.type === 'meetup' ? 'cityMeetup' : 'trip';
                const matchingConfig = configs.find(
                    config => config.formType === formType && config.isActive
                );
                
                if (matchingConfig) {
                    setFormConfig(matchingConfig);
                    // Initialize form data with empty values
                    const initialData: Record<string, any> = {};
                    matchingConfig.fields.forEach(field => {
                        initialData[field.id] = field.type === 'checkbox' ? false : '';
                    });
                    setFormData(initialData);
                } else {
                    console.warn('No active form config found for type:', formType);
                }
            } catch (error) {
                console.error('Error loading form config:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (isOpen) {
            loadFormConfig();
        }
    }, [isOpen, city.type]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as any;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (!formConfig) {
                setSubmitMessage('Form configuration not found.');
                return;
            }

            // Submit form data via AdminService
            await AdminService.submitFormData({
                formId: formConfig.id || '',
                formName: formConfig.name,
                cityId: city.name,
                cityName: city.name,
                submittedData: formData
            });

            setSubmitMessage('✓ Registration successful! We will contact you soon.');
            setTimeout(() => {
                // Reset form
                const initialData: Record<string, any> = {};
                formConfig.fields.forEach(field => {
                    initialData[field.id] = field.type === 'checkbox' ? false : '';
                });
                setFormData(initialData);
                onClose();
                setSubmitMessage('');
            }, 2000);
        } catch (error) {
            console.error('Form submission error:', error);
            setSubmitMessage('⚠️ Error submitting form. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const isMeetup = city.type === 'meetup';
    const typeLabel = isMeetup ? 'City Meetup' : 'Trip Location';
    const typeColor = isMeetup ? 'from-orange-500 to-orange-600' : 'from-green-600 to-green-700';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            {/* Modal backdrop */}
            <div
                className="absolute inset-0"
                onClick={onClose}
            />

            {/* Modal content */}
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative z-51 animate-in fade-in-0 zoom-in-95 duration-300">
                {/* Header */}
                <div className={`bg-gradient-to-r ${typeColor} text-white p-6 flex items-center justify-between`}>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-3xl font-bold">{city.name}</h2>
                            {city.shortName && <span className="text-xl font-semibold opacity-90 bg-white bg-opacity-20 px-3 py-1 rounded-full">{city.shortName}</span>}
                        </div>
                        <p className={`${isMeetup ? 'text-orange-100' : 'text-green-100'} mt-1`}>{typeLabel}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form content */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-gradient-to-br from-gray-50 to-white">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                            <p className="ml-3 text-gray-600 font-medium">Loading form...</p>
                        </div>
                    ) : !formConfig ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
                            <p className="font-semibold">No form available for this event type</p>
                        </div>
                    ) : (
                        <>
                            {submitMessage && (
                                <div className={`p-4 rounded-xl border-l-4 animate-fade-in ${
                                    submitMessage.includes('Error')
                                        ? 'bg-red-50 text-red-700 border-l-red-500'
                                        : 'bg-green-50 text-green-700 border-l-green-500'
                                }`}>
                                    <div className="font-semibold">{submitMessage.includes('Error') ? '⚠️ Error' : '✓ Success'}</div>
                                    <div className="text-sm mt-1">{submitMessage}</div>
                                </div>
                            )}

                            {/* Form Fields Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {formConfig.fields.map((field) => (
                                    <div 
                                        key={field.id} 
                                        className={field.type === 'textarea' || field.type === 'text' && field.name?.toLowerCase().includes('message') ? 'md:col-span-2' : ''}
                                    >
                                        {/* Label */}
                                        {field.type !== 'checkbox' && (
                                            <label className="block text-sm font-bold text-gray-800 mb-2 uppercase tracking-wide">
                                                {field.label}
                                                {field.required && <span className="text-red-500"> *</span>}
                                            </label>
                                        )}

                                        {/* Input Types */}
                                        {(field.type === 'text' || field.type === 'email' || field.type === 'phone' || field.type === 'number') && (
                                            <input
                                                type={field.type === 'phone' ? 'tel' : field.type}
                                                name={field.id}
                                                value={formData[field.id] || ''}
                                                onChange={handleInputChange}
                                                placeholder={field.placeholder}
                                                required={field.required}
                                                pattern={field.validationPattern}
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-300 placeholder-gray-400 font-medium"
                                            />
                                        )}

                                        {/* Textarea */}
                                        {field.type === 'textarea' && (
                                            <textarea
                                                name={field.id}
                                                value={formData[field.id] || ''}
                                                onChange={handleInputChange}
                                                placeholder={field.placeholder}
                                                required={field.required}
                                                rows={4}
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-300 placeholder-gray-400 font-medium resize-none"
                                            />
                                        )}

                                        {/* Select */}
                                        {field.type === 'select' && (
                                            <select
                                                name={field.id}
                                                value={formData[field.id] || ''}
                                                onChange={handleInputChange}
                                                required={field.required}
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-300 bg-white font-medium cursor-pointer"
                                            >
                                                <option value="">{field.placeholder || 'Select an option'}</option>
                                                {field.options?.map((option) => (
                                                    <option key={option} value={option}>{option}</option>
                                                ))}
                                            </select>
                                        )}

                                        {/* Radio */}
                                        {field.type === 'radio' && (
                                            <div className="space-y-2">
                                                {field.options?.map((option) => (
                                                    <label key={option} className="flex items-center gap-3 cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name={field.id}
                                                            value={option}
                                                            checked={formData[field.id] === option}
                                                            onChange={handleInputChange}
                                                            required={field.required}
                                                            className="w-4 h-4 cursor-pointer"
                                                        />
                                                        <span className="text-gray-700">{option}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}

                                        {/* Checkbox */}
                                        {field.type === 'checkbox' && (
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    name={field.id}
                                                    checked={formData[field.id] || false}
                                                    onChange={handleInputChange}
                                                    className="w-4 h-4 cursor-pointer"
                                                />
                                                <span className="text-sm font-medium text-gray-700">{field.label}</span>
                                            </label>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* GDrive Link Section */}
                            {formConfig.gdriveLink && (
                                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600 mb-2">📁 Additional Resources:</p>
                                    <a
                                        href={formConfig.gdriveLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold text-sm hover:underline"
                                    >
                                        🔗 View Event Details on Google Drive
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </a>
                                </div>
                            )}

                            {/* Submit Buttons */}
                            <div className="flex gap-3 pt-6 border-t border-gray-200">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`flex-1 px-6 py-3 rounded-lg font-bold text-white text-lg uppercase tracking-wide transition-all duration-300 transform ${
                                        isSubmitting
                                            ? 'bg-gray-400 cursor-not-allowed opacity-60'
                                            : isMeetup
                                            ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:shadow-xl hover:-translate-y-1 active:translate-y-0'
                                            : 'bg-gradient-to-r from-green-600 to-green-700 hover:shadow-xl hover:-translate-y-1 active:translate-y-0'
                                    }`}
                                >
                                    {isSubmitting ? '⏳ Registering...' : '🚀 Register Now'}
                                </button>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 py-3 border-2 border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-100 transition-all duration-300 uppercase tracking-wide"
                                >
                                    Cancel
                                </button>
                            </div>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
}
