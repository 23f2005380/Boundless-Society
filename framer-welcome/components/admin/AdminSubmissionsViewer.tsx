'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminService, FormSubmission } from '@/lib/admin/adminService';

export default function AdminSubmissionsViewer() {
    const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
    const [filteredSubmissions, setFilteredSubmissions] = useState<FormSubmission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'form' | 'city'>('all');
    const [filterValue, setFilterValue] = useState('');
    const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
    const [sortBy, setSortBy] = useState<'date' | 'form' | 'city'>('date');

    useEffect(() => {
        loadSubmissions();
    }, []);

    useEffect(() => {
        filterSubmissions();
    }, [submissions, filterType, filterValue, sortBy]);

    const loadSubmissions = async () => {
        try {
            setIsLoading(true);
            const data = await AdminService.getFormSubmissions(500);
            setSubmissions(data);
            setError('');
        } catch (err) {
            setError('Failed to load submissions');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const filterSubmissions = () => {
        let filtered = submissions;

        if (filterType === 'form' && filterValue) {
            filtered = filtered.filter(s => s.formName.includes(filterValue));
        } else if (filterType === 'city' && filterValue) {
            filtered = filtered.filter(s => s.cityName?.includes(filterValue));
        }

        // Sort
        if (sortBy === 'form') {
            filtered.sort((a, b) => a.formName.localeCompare(b.formName));
        } else if (sortBy === 'city') {
            filtered.sort((a, b) => (a.cityName || '').localeCompare(b.cityName || ''));
        }
        // 'date' is already in correct order from database

        setFilteredSubmissions(filtered);
    };

    const handleExportCSV = async () => {
        try {
            const csv = await AdminService.exportSubmissionsAsCSV(filteredSubmissions);
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `submissions-${Date.now()}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert('Failed to export CSV');
            console.error(err);
        }
    };

    const handleDelete = async (submissionId: string) => {
        if (!confirm('Are you sure you want to delete this submission?')) return;
        try {
            await AdminService.deleteSubmission(submissionId);
            await loadSubmissions();
        } catch (err) {
            setError('Failed to delete submission');
            console.error(err);
        }
    };

    if (isLoading) {
        return <div className="text-center py-12">Loading submissions...</div>;
    }

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {/* Header and Controls */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Form Submissions ({filteredSubmissions.length})
                </h2>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Filter By
                            </label>
                            <select
                                value={filterType}
                                onChange={(e) => {
                                    setFilterType(e.target.value as any);
                                    setFilterValue('');
                                }}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#3B001B]"
                            >
                                <option value="all">All Submissions</option>
                                <option value="form">By Form</option>
                                <option value="city">By City</option>
                            </select>
                        </div>

                        {filterType !== 'all' && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Search
                                </label>
                                <input
                                    type="text"
                                    value={filterValue}
                                    onChange={(e) => setFilterValue(e.target.value)}
                                    placeholder={`Search ${filterType}...`}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#3B001B]"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Sort By
                            </label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#3B001B]"
                            >
                                <option value="date">Date (Newest)</option>
                                <option value="form">Form Name</option>
                                <option value="city">City Name</option>
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={handleExportCSV}
                                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-semibold"
                            >
                                📥 Export CSV
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Submissions Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-100 border-b-2 border-gray-300">
                            <tr>
                                <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">
                                    Form
                                </th>
                                <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">
                                    City
                                </th>
                                <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">
                                    Submitted
                                </th>
                                <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            <AnimatePresence>
                                {filteredSubmissions.map((submission) => (
                                    <motion.tr
                                        key={submission.id}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="hover:bg-gray-50 transition"
                                    >
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            <span className="font-semibold">{submission.formName}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {submission.cityName || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(submission.submittedAt || 0).toLocaleDateString()} <br />
                                            <span className="text-xs text-gray-500">
                                                {new Date(submission.submittedAt || 0).toLocaleTimeString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right space-x-2">
                                            <button
                                                onClick={() => setSelectedSubmission(submission)}
                                                className="text-blue-600 hover:text-blue-800 font-semibold"
                                            >
                                                View
                                            </button>
                                            <button
                                                onClick={() => handleDelete(submission.id || '')}
                                                className="text-red-600 hover:text-red-800 font-semibold"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Submission Details Modal */}
            <AnimatePresence>
                {selectedSubmission && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl my-8"
                        >
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">
                                Submission Details
                            </h3>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700">Form</p>
                                        <p className="text-lg text-gray-900">{selectedSubmission.formName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700">City</p>
                                        <p className="text-lg text-gray-900">{selectedSubmission.cityName || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700">Submitted</p>
                                        <p className="text-lg text-gray-900">
                                            {new Date(selectedSubmission.submittedAt || 0).toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700">ID</p>
                                        <p className="text-sm text-gray-600 break-all">{selectedSubmission.id}</p>
                                    </div>
                                </div>

                                <div className="border-t pt-6">
                                    <h4 className="font-semibold text-gray-900 mb-4">Form Data</h4>
                                    <div className="space-y-3">
                                        {Object.entries(selectedSubmission.submittedData).map(([key, value]) => (
                                            <div key={key} className="bg-gray-50 p-4 rounded-lg">
                                                <p className="text-sm font-semibold text-gray-700 capitalize">
                                                    {key.replace(/([A-Z])/g, ' $1')}
                                                </p>
                                                <p className="text-gray-900 mt-1">
                                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4 border-t">
                                    <button
                                        onClick={() => setSelectedSubmission(null)}
                                        className="flex-1 bg-gray-300 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-400 transition font-semibold"
                                    >
                                        Close
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleDelete(selectedSubmission.id || '');
                                            setSelectedSubmission(null);
                                        }}
                                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-semibold"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
