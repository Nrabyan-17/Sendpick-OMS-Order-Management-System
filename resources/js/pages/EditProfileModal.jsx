import React, { useState, useEffect } from 'react';
import EditModal from '../components/common/EditModal';

export default function EditProfileModal({ isOpen, onClose, onSubmit, initialData, isLoading }) {
    const [formData, setFormData] = useState({
        photo: '',
        fullName: '',
        username: '',
        phone: '',
        role: '',
        password: '',
        password_confirmation: ''
    });

    useEffect(() => {
        if (isOpen && initialData) {
            setFormData({
                photo: initialData.photo || '',
                fullName: initialData.fullName || '',
                username: initialData.username || '',
                phone: initialData.phone || '',
                role: initialData.role || '',
                password: '',
                password_confirmation: ''
            });
        }
    }, [isOpen, initialData]);

    const fields = [
        {
            name: 'photo',
            label: 'Foto Profil',
            type: 'image-upload',
            description: 'Format: JPG, PNG, GIF. Maksimal 2MB.'
        },
        {
            name: 'fullName',
            label: 'Nama Lengkap',
            type: 'text',
            required: true,
            placeholder: 'Masukkan nama lengkap'
        },
        {
            name: 'username',
            label: 'Username / Email',
            type: 'email',
            required: true,
            readOnly: true,
            help: 'Username tidak dapat diubah secara langsung.'
        },
        {
            name: 'phone',
            label: 'Nomor Telepon',
            type: 'tel',
            required: true,
            placeholder: 'Contoh: 081234567890'
        },
        {
            name: 'role',
            label: 'Role',
            type: 'text',
            required: true,
            readOnly: true,
            help: 'Role ditentukan oleh administrator.'
        },
        {
            name: 'password',
            label: 'Password Baru (Opsional)',
            type: 'password',
            placeholder: 'Kosongkan jika tidak ingin mengubah password',
            description: 'Minimal 8 karakter'
        },
        {
            name: 'password_confirmation',
            label: 'Konfirmasi Password Baru',
            type: 'password',
            placeholder: 'Ulangi password baru'
        }
    ];

    const handleSubmit = async (data) => {
        // Filter out empty password fields if not changing password
        const submitData = { ...data };
        if (!submitData.password) {
            delete submitData.password;
            delete submitData.password_confirmation;
        }
        await onSubmit(submitData);
    };

    return (
        <EditModal
            isOpen={isOpen}
            onClose={onClose}
            onSubmit={handleSubmit}
            initialData={formData}
            fields={fields}
            title="Edit Profile"
            size="lg"
            isLoading={isLoading}
        />
    );
}