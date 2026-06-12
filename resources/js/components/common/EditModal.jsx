import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import InlineMapPicker from './InlineMapPicker';

const EditModal = ({
    isOpen,
    onClose,
    onSubmit,
    data,
    initialData,
    title = 'Edit Data',
    fields = [],
    isLoading = false,
    size = 'lg',
    backdropOpacity = 'default',
    disableScroll = true,
    hideContentScrollbar = false,
    onFieldChange,
    calculateCombinedData,
    jobOrdersData,
    children
}) => {
    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});
    // State untuk alert validasi FTL/LTL multiselect
    const [validationAlert, setValidationAlert] = useState({ show: false, message: '' });
    // State untuk toggle visibility password
    const [passwordVisibility, setPasswordVisibility] = useState({});
    // State untuk general error dari server (e.g., validation errors tanpa field spesifik)
    const [generalError, setGeneralError] = useState('');


    // Ref to track if modal was already open (prevent reset on field changes)
    const wasOpenRef = useRef(false);
    // Ref to track the data/initialData to detect actual data changes
    const prevDataRef = useRef(null);

    // Debug logging
    console.log('🔵 EditModal - isOpen:', isOpen, '| title:', title, '| fields count:', fields.length);

    // Initialize form data ONLY when modal first opens or when data actually changes
    // NOT when fields array changes (which happens when formJobOrderType changes)
    useEffect(() => {
        const sourceData = initialData || data;
        const sourceDataKey = JSON.stringify(sourceData);

        // Check if this is a fresh modal open (was closed, now open)
        const isModalJustOpened = isOpen && !wasOpenRef.current;

        // Check if data actually changed (not just fields prop changing)
        const hasDataChanged = sourceDataKey !== prevDataRef.current;

        if (isOpen && (isModalJustOpened || hasDataChanged)) {
            console.log('🔵 EditModal - Initializing form data. Just opened:', isModalJustOpened, '| Data changed:', hasDataChanged);
            const newFormData = {};
            fields.forEach(field => {
                newFormData[field.key || field.name] = sourceData?.[field.key || field.name] || field.defaultValue || '';
            });
            setFormData(newFormData);
            setErrors({});
            setValidationAlert({ show: false, message: '' }); // Reset alert saat modal dibuka
            setGeneralError(''); // Reset general error saat modal dibuka

            // Update prev data ref
            prevDataRef.current = sourceDataKey;
        }

        // Update wasOpen ref
        wasOpenRef.current = isOpen;

        // Reset refs when modal closes
        if (!isOpen) {
            prevDataRef.current = null;
        }
    }, [isOpen, data, initialData, fields]);

    // Handle input change
    const handleChange = (name, value) => {
        console.log('🔄 EditModal handleChange called:', { name, value });

        if (onFieldChange) {
            // Use custom field change handler if provided
            onFieldChange(name, value, setFormData);
        } else {
            // Default behavior
            setFormData(prev => {
                const newData = {
                    ...prev,
                    [name]: value
                };

                // Auto-fill data jika ini adalah field jobOrders dan ada calculateCombinedData
                if (name === 'jobOrders' && calculateCombinedData) {
                    console.log('📝 jobOrders field changed, calling calculateCombinedData...');
                    const selectedJobOrders = Array.isArray(value) ? value : (value ? [value] : []);
                    console.log('📝 Selected Job Order IDs:', selectedJobOrders);

                    const combinedData = calculateCombinedData(selectedJobOrders);
                    console.log('📝 Combined Data Result:', combinedData);
                    console.log('📝 Driver Value:', combinedData?.driver, '| Vehicle Value:', combinedData?.vehicle);

                    const finalData = {
                        ...newData,
                        ...combinedData
                    };
                    console.log('📝 Final Form Data after merge:', finalData);
                    return finalData;
                }

                return newData;
            });
        }

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        fields.forEach(field => {
            const fieldKey = field.key || field.name;
            const value = formData[fieldKey];
            const isEmptyArray = Array.isArray(value) && value.length === 0;
            const isEmptyString = typeof value === 'string' && value.trim() === '';
            const isMissing = value === undefined || value === null || isEmptyString || isEmptyArray;
            if (field.required && isMissing) {
                newErrors[fieldKey] = `${field.label} harus diisi`;
            }

            // Custom validation
            if (field.validate && formData[fieldKey]) {
                const validationResult = field.validate(formData[fieldKey]);
                if (validationResult !== true) {
                    newErrors[fieldKey] = validationResult;
                }
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submit
    const handleSubmit = async (event) => {
        event.preventDefault();

        // Reset errors sebelum submit
        setGeneralError('');

        if (!validateForm()) {
            return;
        }

        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error('Error submitting form:', error);

            // Handle server-side validation errors
            // Support untuk dua struktur error:
            // 1. error.response?.data?.errors (dari axios langsung)
            // 2. error.errors (dari normalizeError di service)
            const serverErrors = error.response?.data?.errors || error.errors;

            if (serverErrors && typeof serverErrors === 'object') {
                const formattedErrors = {};
                Object.keys(serverErrors).forEach(key => {
                    // Laravel returns array of errors, take the first one
                    const errorValue = serverErrors[key];
                    formattedErrors[key] = Array.isArray(errorValue) ? errorValue[0] : errorValue;
                });
                setErrors(formattedErrors);

                // Jika ada field error, tapi tidak ada field yang cocok di form,
                // tampilkan sebagai general error
                const fieldNames = fields.map(f => f.key || f.name);
                const hasMatchingField = Object.keys(formattedErrors).some(key => fieldNames.includes(key));

                if (!hasMatchingField) {
                    // Format semua error sebagai general message
                    const allMessages = Object.entries(formattedErrors)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join('; ');
                    setGeneralError(allMessages);
                }
            } else if (error.response?.data?.message || error.message) {
                // Tampilkan general error message
                setGeneralError(error.response?.data?.message || error.message);
            }
        }
    };

    // Render input field based on type
    const renderField = (field) => {
        const fieldKey = field.key || field.name;
        const commonProps = {
            id: fieldKey,
            name: fieldKey,
            value: formData[fieldKey] || '',
            onChange: (e) => handleChange(fieldKey, e.target.value),
            className: `
                w-full rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                placeholder:text-slate-400
                ${(typeof field.disabled === 'function' ? field.disabled(formData) : field.disabled) || (typeof field.readOnly === 'function' ? field.readOnly(formData) : field.readOnly)
                    ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                    : errors[fieldKey]
                        ? 'border-red-300 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500'
                        : formData[fieldKey]
                            ? 'border-green-300 bg-green-50/50 text-slate-900 focus:border-indigo-500'
                            : 'border-slate-300 bg-white text-slate-900 hover:border-slate-400 focus:bg-indigo-50/50'
                }
            `,
            disabled: isLoading || (typeof field.disabled === 'function' ? field.disabled(formData) : field.disabled),
            readOnly: typeof field.readOnly === 'function' ? field.readOnly(formData) : field.readOnly
        };

        if (field.type === 'select' && field.multiple) {
            commonProps.value = Array.isArray(formData[fieldKey]) ? formData[fieldKey] : [];
            commonProps.onChange = (event) => {
                const selectedValues = Array.from(event.target.selectedOptions).map((option) => option.value);
                handleChange(fieldKey, selectedValues);
            };
        }

        const resolvedOptions = typeof field.options === 'function' ? field.options() : field.options;

        switch (field.type) {
            case 'multiselect':
                const selectedValues = Array.isArray(formData[fieldKey]) ? formData[fieldKey] : [];

                // ✅ Debug logging
                console.log('📋 Multiselect Debug:', {
                    fieldKey,
                    selectedValues,
                    hasGetServiceType: !!field.getServiceType,
                    formDataKeys: Object.keys(formData)
                });

                // ✅ Cek apakah ada FTL yang sudah terpilih
                const hasFTLSelected = selectedValues.length > 0 && field.getServiceType &&
                    selectedValues.some(id => {
                        const serviceType = field.getServiceType(id);
                        console.log(`  - Checking ${id}: serviceType = ${serviceType}`);
                        return serviceType === 'FTL';
                    });

                // ✅ Cek apakah ada LTL yang sudah terpilih
                const hasLTLSelected = selectedValues.length > 0 && field.getServiceType &&
                    selectedValues.some(id => field.getServiceType(id) === 'LTL');

                // ✅ Tentukan apakah dropdown harus disabled (FTL = dropdown terkunci)
                const isDropdownDisabled = hasFTLSelected;

                console.log('📋 FTL/LTL Check Result:', { hasFTLSelected, hasLTLSelected, isDropdownDisabled });

                // ✅ Filter opsi berdasarkan mode saat ini
                let filteredOptions = field.getFilteredOptions
                    ? field.getFilteredOptions(selectedValues)
                    : resolvedOptions?.map(opt => ({ ...opt, disabled: false, serviceType: null }));

                // Jika LTL sudah terpilih, HIDE opsi FTL (bukan disable, tapi benar-benar tidak tampilkan)
                if (hasLTLSelected && filteredOptions) {
                    filteredOptions = filteredOptions.filter(opt => opt.serviceType !== 'FTL');
                }

                return (
                    <div className="space-y-2">
                        {/* Alert/Warning untuk validasi FTL/LTL */}
                        {validationAlert.show && (
                            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm animate-pulse">
                                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <span className="font-medium">{validationAlert.message}</span>
                            </div>
                        )}

                        {/* Badge indicator untuk tipe layanan yang aktif */}
                        {selectedValues.length > 0 && field.getServiceType && (
                            <div className="flex items-center gap-2">
                                {(() => {
                                    const firstServiceType = field.getServiceType(selectedValues[0]);
                                    if (firstServiceType === 'FTL') {
                                        return (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                                🔒 Mode FTL - Dropdown Terkunci (Hapus item untuk membuka)
                                            </span>
                                        );
                                    } else if (firstServiceType === 'LTL') {
                                        return (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
                                                </svg>
                                                🔓 Mode LTL - Multi-Select Aktif (Hanya sesama LTL)
                                            </span>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                        )}

                        <div className="relative">
                            {/* ✅ Jika FTL terpilih, tampilkan dropdown disabled dengan pesan */}
                            {isDropdownDisabled ? (
                                <div className="w-full rounded-xl border-2 px-4 py-3 text-sm font-medium bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200 flex items-center justify-between">
                                    <span>🔒 Dropdown terkunci (FTL bersifat eksklusif)</span>
                                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                            ) : (
                                <select
                                    {...commonProps}
                                    value=""
                                    onChange={(e) => {
                                        const newValue = e.target.value;
                                        if (newValue && !selectedValues.includes(newValue)) {
                                            // ✅ Validasi sebelum menambah item baru
                                            if (field.validateSelection) {
                                                const validation = field.validateSelection(selectedValues, newValue);
                                                if (!validation.valid) {
                                                    // Tampilkan alert dan jangan tambahkan item
                                                    setValidationAlert({ show: true, message: validation.error });
                                                    // Auto-hide after 4 seconds
                                                    setTimeout(() => setValidationAlert({ show: false, message: '' }), 4000);
                                                    return;
                                                }
                                            }

                                            // Clear any previous alert
                                            setValidationAlert({ show: false, message: '' });

                                            const newValues = [...selectedValues, newValue];
                                            handleChange(fieldKey, newValues);
                                        }
                                    }}
                                >
                                    <option value="">-- Pilih Job Order --</option>
                                    {filteredOptions?.filter(option => !selectedValues.includes(option.value)).map(option => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                            disabled={option.disabled}
                                            className={option.disabled ? 'text-slate-400 bg-slate-50' : ''}
                                        >
                                            {option.label}
                                            {option.serviceType && ` [${option.serviceType}]`}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                        {selectedValues.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {selectedValues.map(value => {
                                    const option = resolvedOptions?.find(opt => opt.value === value);
                                    const serviceType = field.getServiceType ? field.getServiceType(value) : null;

                                    // Warna badge berdasarkan service type
                                    let badgeClass = 'bg-indigo-100 text-indigo-800';
                                    if (serviceType === 'FTL') {
                                        badgeClass = 'bg-purple-100 text-purple-800 border border-purple-300';
                                    } else if (serviceType === 'LTL') {
                                        badgeClass = 'bg-blue-100 text-blue-800 border border-blue-300';
                                    }

                                    return (
                                        <span
                                            key={value}
                                            className={`inline-flex items-center gap-2 px-3 py-1.5 ${badgeClass} text-sm rounded-lg font-medium`}
                                        >
                                            {serviceType && (
                                                <span className="text-xs font-bold opacity-75">[{serviceType}]</span>
                                            )}
                                            {option?.label || value}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newValues = selectedValues.filter(v => v !== value);
                                                    // Reset alert saat menghapus item
                                                    setValidationAlert({ show: false, message: '' });
                                                    handleChange(fieldKey, newValues);
                                                }}
                                                className="hover:opacity-70 transition-opacity"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </span>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );

            case 'textarea':
                return (
                    <textarea
                        {...commonProps}
                        rows={field.rows || 3}
                        placeholder={field.placeholder}
                    />
                );

            case 'select':
                return (
                    <select {...commonProps} multiple={field.multiple}>
                        {!field.multiple && !resolvedOptions?.some(opt => opt.value === '') && (
                            <option value="">-- Pilih {field.label} --</option>
                        )}
                        {resolvedOptions?.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                );

            case 'email':
                return (
                    <input
                        {...commonProps}
                        type="email"
                        placeholder={field.placeholder}
                        autoComplete="email"
                    />
                );

            case 'tel':
                return (
                    <input
                        {...commonProps}
                        type="tel"
                        placeholder={field.placeholder}
                        autoComplete="tel"
                    />
                );

            case 'password':
                const isPasswordVisible = passwordVisibility[fieldKey] || false;
                return (
                    <div className="relative">
                        <input
                            {...commonProps}
                            type={isPasswordVisible ? 'text' : 'password'}
                            placeholder={field.placeholder}
                            autoComplete="new-password"
                            className={`${commonProps.className} pr-12`}
                        />
                        <button
                            type="button"
                            onClick={() => setPasswordVisibility(prev => ({
                                ...prev,
                                [fieldKey]: !prev[fieldKey]
                            }))}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                            aria-label={isPasswordVisible ? 'Sembunyikan password' : 'Tampilkan password'}
                        >
                            {isPasswordVisible ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            )}
                        </button>
                    </div>
                );

            case 'number':
                return (
                    <input
                        {...commonProps}
                        type="number"
                        placeholder={field.placeholder}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                    />
                );

            case 'date':
                return (
                    <input
                        {...commonProps}
                        type="date"
                        placeholder={field.placeholder}
                    />
                );

            case 'datetime-local':
                return (
                    <input
                        {...commonProps}
                        type="datetime-local"
                        placeholder={field.placeholder}
                    />
                );

            case 'image-upload':
                const previewUrl = formData[fieldKey] instanceof File
                    ? URL.createObjectURL(formData[fieldKey])
                    : (formData[fieldKey] || field.defaultValue);

                return (
                    <div className="flex items-center gap-6">
                        <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full border-4 border-slate-50 shadow-md">
                            {previewUrl ? (
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400">
                                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <label
                                htmlFor={fieldKey}
                                className="group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-4 transition-all hover:border-indigo-500 hover:bg-indigo-50/50"
                            >
                                <div className="text-center">
                                    <svg className="mx-auto h-8 w-8 text-slate-400 transition group-hover:text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <p className="mt-2 text-sm font-medium text-slate-600 group-hover:text-indigo-600">
                                        <span className="font-semibold text-indigo-600">Klik untuk upload</span> atau drag and drop
                                    </p>
                                    <p className="mt-1 text-xs text-slate-400">PNG, JPG, GIF up to 2MB</p>
                                </div>
                                <input
                                    id={fieldKey}
                                    name={fieldKey}
                                    type="file"
                                    className="sr-only"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            handleChange(fieldKey, file);
                                        }
                                    }}
                                />
                            </label>
                        </div>
                    </div>
                );

            case 'location-picker':
                // Location picker with inline map
                const latValue = formData[field.latField] || '';
                const lngValue = formData[field.lngField] || '';
                const currentPosition = latValue && lngValue
                    ? { lat: parseFloat(latValue), lng: parseFloat(lngValue) }
                    : null;

                // Get address value from related address field for auto-geocoding
                const addressFieldValue = field.addressField ? (formData[field.addressField] || '') : '';

                return (
                    <InlineMapPicker
                        position={currentPosition}
                        onPositionChange={(coords) => {
                            setFormData(prev => ({
                                ...prev,
                                [field.latField]: coords.lat.toFixed(8),
                                [field.lngField]: coords.lng.toFixed(8)
                            }));
                        }}
                        // ✅ NEW: Callback untuk reverse geocoding - auto-fill alamat
                        onAddressChange={(newAddress) => {
                            if (field.addressField && newAddress) {
                                console.log(`📍 Auto-filling address field "${field.addressField}" with: "${newAddress}"`);
                                setFormData(prev => ({
                                    ...prev,
                                    [field.addressField]: newAddress
                                }));
                            }
                        }}
                        // ✅ NEW: Callback untuk reverse geocoding - auto-fill kota
                        onCityChange={(newCity) => {
                            if (field.cityField && newCity) {
                                console.log(`🏙️ Auto-filling city field "${field.cityField}" with: "${newCity}"`);
                                setFormData(prev => ({
                                    ...prev,
                                    [field.cityField]: newCity
                                }));
                            }
                        }}
                        type={field.locationType || 'pickup'}
                        disabled={isLoading}
                        address={addressFieldValue}
                    />
                );

            default:
                return (
                    <input
                        {...commonProps}
                        type="text"
                        placeholder={field.placeholder}
                        autoComplete={field.autoComplete}
                    />
                );
        }
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={title}
                size={size || "lg"}
                closeOnBackdropClick={!isLoading}
                backdropOpacity={backdropOpacity}
                disableScroll={disableScroll}
                hideContentScrollbar={hideContentScrollbar}
            >
                {children ? (
                    children
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
                        {/* General Error Alert */}
                        {generalError && (
                            <div className="mb-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl animate-pulse">
                                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-red-800">Terjadi Kesalahan</p>
                                    <p className="text-sm text-red-700 mt-1">{generalError}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setGeneralError('')}
                                    className="text-red-400 hover:text-red-600 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        )}

                        {/* Scrollable form fields dengan desain yang lebih menarik */}
                        <div className={`flex-1 ${hideContentScrollbar ? 'space-y-4 overflow-hidden' : 'space-y-6 overflow-y-auto pr-2 custom-scrollbar max-h-[60vh]'}`}>
                            {fields.map((field, index) => {
                                const fieldKey = field.key || field.name;

                                // If hidden field, render directly without wrapper/label
                                if (field.type === 'hidden') {
                                    return (
                                        <input
                                            key={fieldKey}
                                            type="hidden"
                                            name={fieldKey}
                                            value={formData[fieldKey] || ''}
                                        />
                                    );
                                }

                                // ✅ NEW: Support for dynamic hidden property (can be function)
                                const isHidden = typeof field.hidden === 'function'
                                    ? field.hidden(formData)
                                    : field.hidden;
                                if (isHidden) {
                                    return null; // Don't render this field at all
                                }

                                const staggerClass = `field-stagger-${Math.min(index + 1, 8)}`;
                                return (
                                    <div key={fieldKey} className={`group field-wrapper ${staggerClass}`}>
                                        <label
                                            htmlFor={fieldKey}
                                            className={`${hideContentScrollbar ? 'mb-2' : 'mb-3'} block text-sm font-semibold text-slate-700 group-focus-within:text-indigo-600 transition-colors`}
                                        >
                                            {field.label}
                                            {field.required && (
                                                <span className="ml-1 text-red-500 font-medium">*</span>
                                            )}
                                        </label>

                                        <div className="relative">
                                            {renderField(field)}
                                            {/* Icon untuk field yang required - tidak tampil untuk password karena sudah ada eye icon */}
                                            {field.required && !errors[fieldKey] && formData[fieldKey] && field.type !== 'date' && field.type !== 'password' && (
                                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                    <svg className="w-5 h-5 text-green-500 animate-checkmark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>

                                        {errors[fieldKey] && (
                                            <div className={`${hideContentScrollbar ? 'mt-1' : 'mt-2'} flex items-center gap-2 error-shake`}>
                                                <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <p className="text-sm text-red-600 font-medium">
                                                    {errors[fieldKey]}
                                                </p>
                                            </div>
                                        )}

                                        {/* ✅ UPDATED: Support dynamic description (can be function) */}
                                        {field.description && (
                                            <p className="mt-2 text-xs text-slate-500 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-2 rounded-lg border border-blue-200">
                                                ℹ️ {typeof field.description === 'function' ? field.description(formData) : field.description}
                                            </p>
                                        )}

                                        {field.help && (
                                            <p className="mt-2 text-xs text-slate-500 bg-gradient-to-r from-slate-50 to-blue-50 px-3 py-2 rounded-lg border border-slate-200">
                                                💡 {field.help}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Fixed action buttons dengan desain yang lebih menarik */}
                        <div className={`flex justify-end gap-4 border-t border-slate-200 ${hideContentScrollbar ? 'pt-4 mt-6' : 'pt-6 mt-8'} shrink-0 bg-gradient-to-r from-slate-50 to-white px-1`}>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isLoading}
                                className="group relative px-6 py-3 rounded-xl border-2 border-slate-300 bg-white text-slate-700 font-semibold transition-all duration-200 hover:border-slate-400 hover:bg-slate-50 btn-interactive focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 disabled:hover:scale-100"
                            >
                                <span className="relative z-10">Batal</span>
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold btn-interactive shadow-glow focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {isLoading && (
                                    <svg
                                        className="mr-3 h-5 w-5 animate-spin inline"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                )}
                                <span className="relative z-10">
                                    {isLoading ? 'Menyimpan...' : '✨ Simpan Perubahan'}
                                </span>
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </>
    );
};

export default EditModal;