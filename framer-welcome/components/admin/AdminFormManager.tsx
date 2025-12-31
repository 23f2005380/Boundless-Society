'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminService, FormConfig, FormField } from '@/lib/admin/adminService';

export default function AdminFormManager() {
    const [forms, setForms] = useState<FormConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingForm, setEditingForm] = useState<FormConfig | null>(null);
    const [formData, setFormData] = useState<FormConfig>({
        name: '',
        description: '',
        formType: 'general',
        fields: [],
        isActive: true,
        gdriveLink: ''
    });
    const [newField, setNewField] = useState<FormField>({
        id: '',
        name: '',
        type: 'text',
        label: '',
        required: false,
        order: 0
    });

    useEffect(() => {
        loadForms();
    }, []);

    const loadForms = async () => {
        try {
            setIsLoading(true);
            const data = await AdminService.getFormConfigs();
            setForms(data);
            setError('');
        } catch (err) {
            setError('Failed to load forms');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (form?: FormConfig) => {
        if (form) {
            setEditingForm(form);
            setFormData(form);
        } else {
            setEditingForm(null);
            setFormData({
                name: '',
                description: '',
                formType: 'general',
                fields: [],
                isActive: true,
                gdriveLink: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingForm(null);
    };

    const handleAddField = () => {
        if (!newField.name || !newField.label) {
            alert('Please fill in field name and label');
            return;
        }

        const field: FormField = {
            ...newField,
            id: Date.now().toString(),
            order: formData.fields.length
        };

        setFormData({
            ...formData,
            fields: [...formData.fields, field]
        });

        setNewField({
            id: '',
            name: '',
            type: 'text',
            label: '',
            required: false,
            order: 0
        });
    };

    const handleRemoveField = (fieldId: string) => {
        setFormData({
            ...formData,
            fields: formData.fields.filter(f => f.id !== fieldId)
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingForm?.id) {
                await AdminService.updateFormConfig(editingForm.id, formData);
            } else {
                await AdminService.addFormConfig(formData);
            }
            await loadForms();
            handleCloseModal();
        } catch (err) {
            setError('Failed to save form');
            console.error(err);
        }
    };

    const handleDelete = async (formId: string) => {
        if (!confirm('Are you sure you want to delete this form?')) return;
        try {
            await AdminService.deleteFormConfig(formId);
            await loadForms();
        } catch (err) {
            setError('Failed to delete form');
            console.error(err);
        }
    };

    if (isLoading) {
        return <div className="text-center py-12">Loading forms...</div>;
    }

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Form Configurations</h2>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-[#3B001B] text-white px-6 py-2 rounded-lg hover:bg-[#6d1a2c] transition font-semibold"
                >
                    + Create Form
                </button>
            </div>

            {/* Forms List */}
            <div className="grid gap-4">
                <AnimatePresence>
                    {forms.map((form) => (
                        <motion.div
                            key={form.id}
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-gray-900">{form.name}</h3>
                                    <p className="text-gray-600 text-sm mt-1">{form.description}</p>
                                    <div className="flex gap-3 mt-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                            form.isActive
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {form.isActive ? '✓ Active' : '✗ Inactive'}
                                        </span>
                                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                                            {form.formType}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4">
                                <p className="text-sm font-semibold text-gray-700 mb-2">
                                    Fields ({form.fields.length}):
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {form.fields.map(field => (
                                        <span
                                            key={field.id}
                                            className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-xs"
                                        >
                                            {field.label} {field.required ? '*' : ''}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleOpenModal(form)}
                                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition text-sm font-semibold"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(form.id || '')}
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
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl my-8"
                        >
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">
                                {editingForm ? 'Edit Form' : 'Create New Form'}
                            </h3>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Basic Info */}
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-4">Form Information</h4>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Form Name
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#3B001B]"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Description
                                            </label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                rows={2}
                                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#3B001B]"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Google Drive Link <span className="text-gray-500">(Optional)</span>
                                            </label>
                                            <input
                                                type="url"
                                                value={formData.gdriveLink || ''}
                                                onChange={(e) => setFormData({ ...formData, gdriveLink: e.target.value })}
                                                placeholder="https://drive.google.com/..."
                                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#3B001B]"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">📁 Link to event details, resources, or photos on Google Drive</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Form Type
                                                </label>
                                                <select
                                                    value={formData.formType}
                                                    onChange={(e) => setFormData({ ...formData, formType: e.target.value as any })}
                                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#3B001B]"
                                                >
                                                    <option value="general">General</option>
                                                    <option value="cityMeetup">City Meetup</option>
                                                    <option value="trip">Trip</option>
                                                </select>
                                            </div>

                                            <div className="flex items-end">
                                                <label className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.isActive}
                                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                                        className="w-4 h-4 rounded"
                                                    />
                                                    <span className="text-sm font-semibold text-gray-700">
                                                        Active
                                                    </span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Fields */}
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-4">Form Fields</h4>

                                    {/* Existing Fields */}
                                    {formData.fields.length > 0 && (
                                        <div className="space-y-2 mb-6">
                                            {formData.fields.map((field, idx) => (
                                                <div
                                                    key={field.id}
                                                    className="bg-gray-50 p-3 rounded-lg flex items-center justify-between"
                                                >
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{field.label}</p>
                                                        <p className="text-xs text-gray-600">
                                                            {field.type} {field.required ? '(Required)' : '(Optional)'}
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveField(field.id)}
                                                        className="text-red-600 hover:text-red-800 font-semibold"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Add New Field */}
                                    <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Field Name
                                            </label>
                                            <input
                                                type="text"
                                                value={newField.name}
                                                onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                                                placeholder="e.g., fullName"
                                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#3B001B]"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Field Label
                                            </label>
                                            <input
                                                type="text"
                                                value={newField.label}
                                                onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                                                placeholder="e.g., Full Name"
                                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#3B001B]"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Field Type
                                                </label>
                                                <select
                                                    value={newField.type}
                                                    onChange={(e) => setNewField({ ...newField, type: e.target.value as any })}
                                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#3B001B]"
                                                >
                                                    <option value="text">Text</option>
                                                    <option value="email">Email</option>
                                                    <option value="phone">Phone</option>
                                                    <option value="number">Number</option>
                                                    <option value="textarea">Textarea</option>
                                                    <option value="select">Select</option>
                                                    <option value="checkbox">Checkbox</option>
                                                    <option value="radio">Radio</option>
                                                </select>
                                            </div>

                                            <div className="flex items-end">
                                                <label className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={newField.required}
                                                        onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                                                        className="w-4 h-4 rounded"
                                                    />
                                                    <span className="text-sm font-semibold text-gray-700">
                                                        Required
                                                    </span>
                                                </label>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleAddField}
                                            className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-semibold"
                                        >
                                            + Add Field
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4 border-t">
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
                                        {editingForm ? 'Update' : 'Create'}
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
