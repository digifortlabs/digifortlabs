"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, ShoppingCart, Plus, Minus, Trash2, Printer } from 'lucide-react';
import { apiFetch } from '@/config/api';
import { toast } from 'sonner';

interface InventoryItem {
    id: number;
    name: string;
    stock: number;
    price: number;
}

interface CartItem extends InventoryItem {
    cartQuantity: number;
}

export default function PharmacyPOS() {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<InventoryItem[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    
    // Walk-in details
    const [walkinName, setWalkinName] = useState('');
    const [walkinPhone, setWalkinPhone] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    
    const [isProcessing, setIsProcessing] = useState(false);

    // Search Inventory
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.length >= 2) {
                setIsSearching(true);
                try {
                    const results = await apiFetch(`/pharmacy/medicines/search?query=${encodeURIComponent(searchTerm)}`);
                    setSearchResults(results || []);
                } catch (error) {
                    console.error("Search failed:", error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const addToCart = (item: InventoryItem) => {
        if (item.stock <= 0) {
            toast.error("Item out of stock!");
            return;
        }
        
        const existing = cart.find(c => c.id === item.id);
        if (existing) {
            if (existing.cartQuantity >= item.stock) {
                toast.error(`Only ${item.stock} in stock`);
                return;
            }
            setCart(cart.map(c => c.id === item.id ? { ...c, cartQuantity: c.cartQuantity + 1 } : c));
        } else {
            setCart([...cart, { ...item, cartQuantity: 1 }]);
        }
        toast.success(`Added ${item.name} to cart`);
    };

    const updateQuantity = (id: number, delta: number) => {
        setCart(cart.map(c => {
            if (c.id === id) {
                const newQ = c.cartQuantity + delta;
                if (newQ > 0 && newQ <= c.stock) {
                    return { ...c, cartQuantity: newQ };
                }
            }
            return c;
        }));
    };

    const removeFromCart = (id: number) => {
        setCart(cart.filter(c => c.id !== id));
    };

    const subtotal = cart.reduce((acc, curr) => acc + (curr.price * curr.cartQuantity), 0);
    const tax = subtotal * 0; // Assuming tax is inclusive or 0 for now. Can be adjusted.
    const total = subtotal + tax;

    const handleCheckout = async () => {
        if (cart.length === 0) {
            toast.error("Cart is empty");
            return;
        }

        setIsProcessing(true);
        try {
            const payload = {
                walkin_name: walkinName || null,
                walkin_phone: walkinPhone || null,
                items: cart.map(c => ({
                    item_id: c.id,
                    name: c.name,
                    quantity: c.cartQuantity,
                    unit_price: c.price,
                    total: c.price * c.cartQuantity
                })),
                subtotal,
                tax_amount: tax,
                total_amount: total,
                payment_method: paymentMethod
            };

            const response = await apiFetch('/pharmacy/direct-sale', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            toast.success("Sale completed successfully!");
            // Reset
            setCart([]);
            setWalkinName('');
            setWalkinPhone('');
            setSearchTerm('');
            
        } catch (error: any) {
            console.error("Checkout failed:", error);
            toast.error(error.message || "Checkout failed");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto pb-24">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <ShoppingCart className="w-7 h-7 text-emerald-600" />
                        Point of Sale (POS)
                    </h1>
                    <p className="text-slate-500 mt-1">Direct billing for walk-in patients</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Inventory Search */}
                <div className="lg:col-span-2 space-y-4">
                    <Card>
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-lg">Search Inventory</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <Input 
                                    placeholder="Search medicine by name..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 h-12 text-lg"
                                />
                            </div>

                            <div className="min-h-[300px] border rounded-lg bg-slate-50 p-2 overflow-y-auto max-h-[500px]">
                                {isSearching ? (
                                    <div className="text-center py-8 text-slate-500">Searching...</div>
                                ) : searchResults.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {searchResults.map(item => (
                                            <div key={item.id} className="bg-white p-3 rounded-lg border shadow-sm flex justify-between items-center hover:border-emerald-300 transition-colors">
                                                <div>
                                                    <h4 className="font-bold text-slate-800">{item.name}</h4>
                                                    <p className="text-sm text-slate-500">Stock: {item.stock} | ₹{item.price.toFixed(2)}</p>
                                                </div>
                                                <Button 
                                                    size="sm" 
                                                    className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                                    onClick={() => addToCart(item)}
                                                    disabled={item.stock <= 0}
                                                >
                                                    <Plus className="w-4 h-4 mr-1" /> Add
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : searchTerm.length >= 2 ? (
                                    <div className="text-center py-8 text-slate-500">No medicines found.</div>
                                ) : (
                                    <div className="text-center py-12 text-slate-400">
                                        Type at least 2 characters to search
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Cart & Checkout */}
                <div className="space-y-4">
                    <Card className="flex flex-col h-full border-indigo-100 shadow-md">
                        <CardHeader className="bg-indigo-50 border-b border-indigo-100 pb-4">
                            <CardTitle className="text-lg text-indigo-900 flex justify-between">
                                <span>Current Bill</span>
                                <span className="bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full text-sm">{cart.length} items</span>
                            </CardTitle>
                        </CardHeader>
                        
                        <CardContent className="pt-4 flex-1 flex flex-col">
                            {/* Walkin Details */}
                            <div className="space-y-3 mb-6 bg-slate-50 p-3 rounded-lg border">
                                <div>
                                    <Label className="text-xs text-slate-500">Walk-in Name (Optional)</Label>
                                    <Input 
                                        size={1}
                                        placeholder="e.g. John Doe" 
                                        value={walkinName} 
                                        onChange={e => setWalkinName(e.target.value)}
                                        className="h-8"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs text-slate-500">Phone (Optional)</Label>
                                    <Input 
                                        size={1}
                                        placeholder="e.g. 9876543210" 
                                        value={walkinPhone} 
                                        onChange={e => setWalkinPhone(e.target.value)}
                                        className="h-8"
                                    />
                                </div>
                            </div>

                            {/* Cart Items */}
                            <div className="flex-1 overflow-y-auto space-y-3 min-h-[200px] mb-4">
                                {cart.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                                        <ShoppingCart className="w-12 h-12 mb-2 opacity-20" />
                                        Cart is empty
                                    </div>
                                ) : (
                                    cart.map(c => (
                                        <div key={c.id} className="flex flex-col p-2 border rounded-md bg-white">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-semibold text-sm line-clamp-1">{c.name}</span>
                                                <span className="font-bold text-sm">₹{(c.price * c.cartQuantity).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-1 bg-slate-100 rounded-md border">
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-none" onClick={() => updateQuantity(c.id, -1)}>
                                                        <Minus className="w-3 h-3" />
                                                    </Button>
                                                    <span className="text-xs font-semibold w-6 text-center">{c.cartQuantity}</span>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-none" onClick={() => updateQuantity(c.id, 1)}>
                                                        <Plus className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:bg-red-50" onClick={() => removeFromCart(c.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Summary & Checkout */}
                            <div className="border-t pt-4 space-y-4 mt-auto">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Subtotal</span>
                                    <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                                    <span className="font-bold text-indigo-900">Total</span>
                                    <span className="font-black text-2xl text-indigo-700">₹{total.toFixed(2)}</span>
                                </div>

                                <div>
                                    <Label className="mb-1 block text-sm">Payment Method</Label>
                                    <select 
                                        className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white"
                                        value={paymentMethod}
                                        onChange={e => setPaymentMethod(e.target.value)}
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Card">Card</option>
                                        <option value="UPI">UPI</option>
                                    </select>
                                </div>

                                <Button 
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-lg font-bold"
                                    disabled={cart.length === 0 || isProcessing}
                                    onClick={handleCheckout}
                                >
                                    {isProcessing ? "Processing..." : "Complete Sale"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
