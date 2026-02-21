import React, { useEffect, useState } from 'react';
import { Users, Zap, Lightbulb, Trash2, Plus, Loader2, Search } from 'lucide-react';
import { api } from '../lib/api';

interface User {
    id: number;
    email: string;
    name?: string;
    location?: string;
    household_size?: string;
    primary_vehicle?: string;
    home_type?: string;
    created_at: string;
}

interface EmissionFactor {
    id: number;
    category: string;
    subcategory: string;
    factor: number;
    unit: string;
    updated_at: string;
}

interface Recommendation {
    id?: number;
    user_id?: number;
    title: string;
    description: string;
    impact: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    category: string;
    color: string;
    bg: string;
}

export const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'users' | 'factors' | 'suggestions'>('users');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Data states
    const [users, setUsers] = useState<User[]>([]);
    const [factors, setFactors] = useState<EmissionFactor[]>([]);
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Form states for suggestions
    const [editingRec, setEditingRec] = useState<Recommendation | null>(null);
    const [isAddingRec, setIsAddingRec] = useState(false);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            if (activeTab === 'users') {
                const data = await api.admin.getUsers();
                setUsers(data);
            } else if (activeTab === 'factors') {
                const data = await api.admin.getFactors();
                setFactors(data);
            } else if (activeTab === 'suggestions') {
                const [recsData, usersData] = await Promise.all([
                    api.admin.getRecommendations(),
                    api.admin.getUsers()
                ]);
                setRecommendations(recsData);
                setUsers(usersData);
            }
        } catch (err: any) {
            setError(err.message || `Failed to fetch ${activeTab}`);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateFactor = async (id: number, newValue: string) => {
        const factorNum = parseFloat(newValue);
        if (isNaN(factorNum)) return;

        try {
            await api.admin.updateFactor(id, factorNum);
            setFactors(factors.map(f => f.id === id ? { ...f, factor: factorNum } : f));
            setSuccess('Factor updated successfully');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to update factor');
        }
    };

    const handleSaveRecommendation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRec) return;

        try {
            if (editingRec.id) {
                await api.admin.updateRecommendation(editingRec.id, editingRec);
                setRecommendations(recommendations.map(r => r.id === editingRec.id ? editingRec : r));
            } else {
                const newRec = await api.admin.createRecommendation(editingRec);
                setRecommendations([newRec, ...recommendations]);
            }
            setEditingRec(null);
            setIsAddingRec(false);
            setSuccess('Recommendation saved');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to save recommendation');
        }
    };

    const handleDeleteRecommendation = async (id: number) => {
        if (!confirm('Are you sure you want to delete this suggestion?')) return;
        try {
            await api.admin.deleteRecommendation(id);
            setRecommendations(recommendations.filter(r => r.id !== id));
            setSuccess('Recommendation deleted');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to delete recommendation');
        }
    };

    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Admin Control Panel</h1>
                    <p className="text-gray-600">Manage users, emission factors, and system-wide suggestions</p>
                </div>
                {success && (
                    <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg border border-emerald-200">
                        {success}
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex space-x-4 mb-8 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`flex items-center space-x-2 px-6 py-3 font-medium transition-colors ${activeTab === 'users' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Users className="h-5 w-5" />
                    <span>Registered Users</span>
                </button>
                <button
                    onClick={() => setActiveTab('factors')}
                    className={`flex items-center space-x-2 px-6 py-3 font-medium transition-colors ${activeTab === 'factors' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Zap className="h-5 w-5" />
                    <span>Emission Factors</span>
                </button>
                <button
                    onClick={() => setActiveTab('suggestions')}
                    className={`flex items-center space-x-2 px-6 py-3 font-medium transition-colors ${activeTab === 'suggestions' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Lightbulb className="h-5 w-5" />
                    <span>My Suggestions</span>
                </button>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                </div>
            ) : error ? (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 mb-6">
                    {error}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Tab Content: Users */}
                    {activeTab === 'users' && (
                        <div className="p-6">
                            <div className="mb-6 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    type="text"
                                    placeholder="Search users by email or name..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profile Details</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredUsers.map((user) => (
                                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900">{user.name || 'No Name'}</div>
                                                    <div className="text-sm text-gray-500">{user.email}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-xs text-gray-600 grid grid-cols-2 gap-x-4 gap-y-1">
                                                        <span>Loc: {user.location || '-'}</span>
                                                        <span>Veh: {user.primary_vehicle || '-'}</span>
                                                        <span>Size: {user.household_size || '-'}</span>
                                                        <span>Home: {user.home_type || '-'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Tab Content: Factors */}
                    {activeTab === 'factors' && (
                        <div className="p-6">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subcategory</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Factor Value</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {factors.map((f) => (
                                            <tr key={f.id}>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900 capitalize">{f.category}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500 capitalize">{f.subcategory}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-2">
                                                        <input
                                                            type="number"
                                                            step="0.00000001"
                                                            value={f.factor}
                                                            onChange={(e) => handleUpdateFactor(f.id, e.target.value)}
                                                            className="w-32 px-2 py-1 border border-gray-200 rounded focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
                                                        />
                                                        <div className="text-xs text-gray-400">
                                                            Updated: {new Date(f.updated_at).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{f.unit}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Tab Content: Suggestions */}
                    {activeTab === 'suggestions' && (
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-semibold">Managed Suggestions</h3>
                                {!isAddingRec && (
                                    <button
                                        onClick={() => {
                                            setIsAddingRec(true);
                                            setEditingRec({ title: '', description: '', impact: '', difficulty: 'Easy', category: 'Transport', color: 'text-blue-600', bg: 'bg-blue-100' });
                                        }}
                                        className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                                    >
                                        <Plus className="h-4 w-4" />
                                        <span>New Suggestion</span>
                                    </button>
                                )}
                            </div>

                            {(isAddingRec || editingRec) && (
                                <form onSubmit={handleSaveRecommendation} className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                            <input
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                                                value={editingRec?.title || ''}
                                                onChange={e => setEditingRec({ ...editingRec!, title: e.target.value })}
                                                placeholder="e.g. Install Solar Panels"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                            <input
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                                                value={editingRec?.category || ''}
                                                onChange={e => setEditingRec({ ...editingRec!, category: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                            <textarea
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                                                rows={2}
                                                value={editingRec?.description || ''}
                                                onChange={e => setEditingRec({ ...editingRec!, description: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Target Individual User (Optional)</label>
                                            <select
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                                                value={editingRec?.user_id || ''}
                                                onChange={e => setEditingRec({ ...editingRec!, user_id: e.target.value ? parseInt(e.target.value) : undefined })}
                                            >
                                                <option value="">Global (All Users)</option>
                                                {users.map(u => (
                                                    <option key={u.id} value={u.id}>{u.name || u.email} ({u.email})</option>
                                                ))}
                                            </select>
                                            <p className="mt-1 text-xs text-gray-500 italic">Select a user to give an individual suggestion, or keep as "Global" for all users.</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Impact (e.g. 0.5 tons)</label>
                                            <input
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                                                value={editingRec?.impact || ''}
                                                onChange={e => setEditingRec({ ...editingRec!, impact: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                                            <select
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                                                value={editingRec?.difficulty || 'Easy'}
                                                onChange={e => setEditingRec({ ...editingRec!, difficulty: e.target.value as any })}
                                            >
                                                <option>Easy</option>
                                                <option>Medium</option>
                                                <option>Hard</option>
                                            </select>
                                        </div>
                                        <div className="flex space-x-2 pt-6">
                                            <button type="submit" className="flex-1 bg-emerald-600 text-white rounded-lg py-2 hover:bg-emerald-700">Save</button>
                                            <button type="button" onClick={() => { setEditingRec(null); setIsAddingRec(false); }} className="px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
                                        </div>
                                    </div>
                                </form>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {recommendations.map((rec) => (
                                    <div key={rec.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${rec.bg} ${rec.color}`}>{rec.category}</span>
                                                <span className="text-xs text-gray-500">{rec.difficulty}</span>
                                                {rec.user_id && (
                                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                                                        Individual: {users.find(u => u.id === rec.user_id)?.email || `User #${rec.user_id}`}
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                                            <p className="text-sm text-gray-600 line-clamp-2">{rec.description}</p>
                                            <div className="mt-1 text-xs font-medium text-emerald-600">Savings: {rec.impact}</div>
                                        </div>
                                        <div className="flex flex-col space-y-2 ml-4">
                                            <button onClick={() => setEditingRec(rec)} className="p-1.5 text-gray-400 hover:text-emerald-600 transition-colors">
                                                <Plus className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => handleDeleteRecommendation(rec.id!)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
