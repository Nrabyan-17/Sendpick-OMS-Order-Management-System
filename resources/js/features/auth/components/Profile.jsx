import React, { useState } from 'react';
import { useUser } from '../../../context/UserContext';
import { HiPencil } from 'react-icons/hi2';
import EditProfileModal from '../../../pages/EditProfileModal';

export default function Profile() {
    const { user, updateUser } = useUser();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleUpdateProfile = async (updatedData) => {
        // ✅ Mode Lokal: Simpan perubahan ke localStorage tanpa memanggil API
        // Ini karena sistem login/logout belum diimplementasikan

        setIsLoading(true); // Mulai loading

        // Simulasi delay agar efek loading terlihat (opsional, bisa dihapus jika tidak perlu)
        await new Promise(resolve => setTimeout(resolve, 800));

        let photoValue = updatedData.photo;

        // Jika foto adalah File baru, konversi ke Data URL agar bisa disimpan di localStorage
        if (updatedData.photo instanceof File) {
            photoValue = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(updatedData.photo);
            });
        }

        const updatedUser = {
            ...user,
            fullName: updatedData.fullName,
            username: updatedData.username,
            phone: updatedData.phone,
            role: updatedData.role,
            photo: photoValue,
        };

        updateUser(updatedUser);
        setIsLoading(false); // Selesai loading
        setIsEditModalOpen(false);
    };

    return (
        <div className="w-full">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
                        <div className="flex items-center gap-6">
                            <div className="h-24 w-24 rounded-full bg-indigo-500 overflow-hidden flex items-center justify-center text-white text-3xl font-semibold shrink-0 border-4 border-slate-50 shadow-md">
                                {user.photo ? (
                                    <img
                                        src={user.photo instanceof File ? URL.createObjectURL(user.photo) : user.photo}
                                        alt={user.fullName}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span>{user.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'GU'}</span>
                                )}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">{user.fullName}</h2>
                                <p className="text-indigo-600 font-medium mb-1">{user.role}</p>
                                <p className="text-slate-500 text-sm">Kelola informasi profil dan keamanan akun Anda di sini.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-sm shadow-indigo-200"
                        >
                            <HiPencil className="h-4 w-4" />
                            Edit Profile
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                                NAMA LENGKAP
                            </label>
                            <p className="text-base font-semibold text-slate-900">{user.fullName}</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                USER NAME <span className="text-slate-300 cursor-help" title="Username tidak dapat diubah">ⓘ</span>
                            </label>
                            <p className="text-base font-semibold text-slate-900">{user.username}</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                                NOMOR TELEPON
                            </label>
                            <p className="text-base font-semibold text-slate-900">{user.phone}</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                                ROLE
                            </label>
                            <p className="text-base font-semibold text-slate-900">{user.role}</p>
                        </div>


                    </div>
                </div>

                <div className="bg-slate-50 px-8 py-4 border-t border-slate-200">
                    <p className="text-xs text-slate-500">
                        Informasi profil diperbarui secara berkala. Gunakan tombol refresh untuk memastikan data terbaru tampil di halaman ini.
                    </p>
                </div>
            </div>

            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={handleUpdateProfile}
                initialData={user}
                isLoading={isLoading}
            />
        </div>
    );
}
