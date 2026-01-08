"use client";

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ForgotPasswordPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <Navbar />
            <div className="flex-1 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 mt-16">
                <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl">
                    <div className="text-center">
                        <h2 className="text-3xl font-extrabold text-slate-900">Reset Password</h2>
                        <p className="mt-2 text-slate-500">
                            Please contact your System Administrator or Digifort Support to reset your password.
                        </p>
                    </div>
                    <div className="mt-8 text-center text-sm">
                        <p className="font-medium text-slate-700">Support Contact:</p>
                        <p className="text-blue-600">support@digifortlabs.com</p>
                    </div>
                    <div className="mt-6 flex justify-center">
                        <a href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                            Back to Login
                        </a>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
