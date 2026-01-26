
import { useState, useEffect } from 'react';
import {
    Package,
    Plus,
    Search,
    AlertCircle,
    Box,
    Trash2
} from 'lucide-react';
import { apiFetch } from '@/config/api';

interface InventoryItem {
    item_id: number;
    name: string;
    category: string;
    current_stock: number;
    unit_price: number;
    reorder_point: number;
    unit: string;
    last_updated: string;
}

export default function InventoryManager() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);

    // Add Item Form State
    const [newItem, setNewItem] = useState({
        name: '',
        category: 'Consumables',
        unit_price: '',
        reorder_point: '10',
        unit: 'units',
        current_stock: '0'
    });

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const data = await apiFetch('/inventory/');
            setItems(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    const handleAddItem = async () => {
        try {
            await apiFetch('/inventory/', {
                method: 'POST',
                body: JSON.stringify({
                    ...newItem,
                    unit_price: parseFloat(newItem.unit_price) || 0,
                    reorder_point: parseInt(newItem.reorder_point) || 10,
                    current_stock: parseInt(newItem.current_stock) || 0
                })
            });
            setShowAddModal(false);
            setNewItem({ name: '', category: 'Consumables', unit_price: '', reorder_point: '10', unit: 'units', current_stock: '0' });
            fetchInventory();
        } catch (error) {
            alert("Failed to add item");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this item?")) return;
        try {
            await apiFetch(`/inventory/${id}`, { method: 'DELETE' });
            fetchInventory();
        } catch (e) {
            alert("Failed to delete");
        }
    };

    // Filtered Items
    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Package size={24} />
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-bold">Total SKUs</p>
                        <h3 className="text-2xl font-bold text-slate-900">{items.length}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-bold">Low Stock Items</p>
                        <h3 className="text-2xl font-bold text-slate-900">{items.filter(i => i.current_stock <= i.reorder_point).length}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <Box size={24} />
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-bold">Total Stock Value</p>
                        <h3 className="text-2xl font-bold text-slate-900">₹{items.reduce((acc, i) => acc + (i.current_stock * i.unit_price), 0).toLocaleString()}</h3>
                    </div>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search inventory..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-slate-200"
                >
                    <Plus size={18} /> Add New Item
                </button>
            </div>

            {/* Inventory Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Item Name</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Stock Level</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Unit Price</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Value</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={6} className="p-8 text-center text-slate-400">Loading inventory...</td></tr>
                        ) : filteredItems.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-slate-400">No items found.</td></tr>
                        ) : filteredItems.map(item => (
                            <tr key={item.item_id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                            <Package size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">{item.name}</p>
                                            <p className="text-xs text-slate-500 font-mono">ID: {item.item_id}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase">{item.category}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className={`font-bold ${item.current_stock <= item.reorder_point ? 'text-red-600' : 'text-slate-900'}`}>
                                            {item.current_stock}
                                        </span>
                                        <span className="text-xs text-slate-500">{item.unit}</span>
                                        {item.current_stock <= item.reorder_point && (
                                            <AlertCircle size={14} className="text-red-500 animate-pulse" />
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-slate-600">
                                    ₹{item.unit_price.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-slate-900">
                                    ₹{(item.current_stock * item.unit_price).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleDelete(item.item_id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Item Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-900">Add New Inventory Item</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><Plus size={24} className="rotate-45" /></button>
                        </div>

                        <div className="space-y-3">
                            <input
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                                placeholder="Item Name (e.g. A4 Paper)"
                                value={newItem.name}
                                onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <select
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                    value={newItem.category}
                                    onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                                >
                                    <option value="Consumables">Consumables</option>
                                    <option value="Medical">Medical</option>
                                    <option value="IT Equipment">IT Equipment</option>
                                    <option value="Furniture">Furniture</option>
                                </select>
                                <input
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                                    placeholder="Unit (e.g. Box)"
                                    value={newItem.unit}
                                    onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
                                    title="Unit of Measurement"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="number"
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                                    placeholder="Price per Unit"
                                    value={newItem.unit_price}
                                    onChange={e => setNewItem({ ...newItem, unit_price: e.target.value })}
                                    title="Unit Price"
                                />
                                <input
                                    type="number"
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                                    placeholder="Initial Stock"
                                    value={newItem.current_stock}
                                    onChange={e => setNewItem({ ...newItem, current_stock: e.target.value })}
                                    title="Current Stock"
                                />
                            </div>
                            <input
                                type="number"
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                                placeholder="Reorder Alert Level"
                                value={newItem.reorder_point}
                                onChange={e => setNewItem({ ...newItem, reorder_point: e.target.value })}
                                title="Reorder Point"
                            />
                        </div>

                        <button
                            onClick={handleAddItem}
                            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-black transition-all"
                        >
                            Save Item
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
