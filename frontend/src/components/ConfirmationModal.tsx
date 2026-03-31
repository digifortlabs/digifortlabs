import React, { useEffect, useState } from 'react';
import { AlertTriangle, Info, CheckCircle, X, HelpCircle, AlertOctagon, Loader2 } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (inputValue?: string) => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info' | 'success';
    requiresInput?: boolean;
    inputPlaceholder?: string;
    isLoading?: boolean;
    closeOnConfirm?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = 'danger',
    requiresInput = false,
    inputPlaceholder = "",
    isLoading = false,
    closeOnConfirm = true
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [inputValue, setInputValue] = useState("");

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            setInputValue("");
        } else {
            const timer = setTimeout(() => setIsVisible(false), 200); // Wait for exit animation
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'danger': return <AlertOctagon size={48} className="text-red-500" />;
            case 'warning': return <AlertTriangle size={48} className="text-amber-500" />;
            case 'success': return <CheckCircle size={48} className="text-emerald-500" />;
            default: return <Info size={48} className="text-indigo-500" />;
        }
    };

    const getConfirmBtnClass = () => {
        switch (type) {
            case 'danger': return "bg-red-600 hover:bg-red-700 focus:ring-red-500";
            case 'warning': return "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500";
            case 'success': return "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500";
            default: return "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500";
        }
    };

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={isLoading ? undefined : onClose}
            />

            {/* Modal Content */}
            <div className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all duration-200 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>

                {/* Decorative Top Bar */}
                <div className={`h-2 w-full ${type === 'danger' ? 'bg-red-500' : type === 'warning' ? 'bg-amber-500' : type === 'success' ? 'bg-emerald-500' : 'bg-indigo-500'}`} />

                <div className="p-6">
                    <div className="flex flex-col items-center text-center">
                        <div className={`mb-4 p-4 rounded-full ${type === 'danger' ? 'bg-red-50' : type === 'warning' ? 'bg-amber-50' : type === 'success' ? 'bg-emerald-50' : 'bg-indigo-50'}`}>
                            {getIcon()}
                        </div>

                        <h3 className="text-xl font-black text-slate-800 mb-2">
                            {title}
                        </h3>

                        <p className="text-slate-600 mb-6 leading-relaxed whitespace-pre-line">
                            {message}
                        </p>

                        {requiresInput && (
                            <div className="w-full mb-6">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder={inputPlaceholder}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-center font-bold text-slate-800 placeholder:font-normal"
                                    autoFocus
                                    disabled={isLoading}
                                />
                            </div>
                        )}

                        <div className="flex gap-3 w-full">
                            <button
                                onClick={onClose}
                                disabled={isLoading}
                                className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-colors disabled:opacity-50"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={() => {
                                    onConfirm(inputValue);
                                    if (closeOnConfirm) onClose();
                                }}
                                disabled={isLoading || (requiresInput && !inputValue)}
                                className={`flex-1 px-4 py-2.5 text-white rounded-xl font-bold shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${getConfirmBtnClass()}`}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Processing...
                                    </>
                                ) : confirmText}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="absolute top-4 right-4">
                    <button onClick={onClose} disabled={isLoading} className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50">
                        <X size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
