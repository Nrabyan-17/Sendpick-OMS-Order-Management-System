import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { fetchDrivers } from '../../features/drivers/services/driverService';
import { fetchVehicles } from '../../features/vehicles/services/vehicleService';

/**
 * DeliveryOrderModal - Form untuk membuat Delivery Order sesuai SRS
 * 
 * Delivery Order adalah dokumen yang dibuat dari (mengeksekusi) Job Order atau Manifest yang sudah ada.
 * Form ini memungkinkan Admin untuk:
 * 1. Memilih tipe sumber (Job Order atau Manifest)
 * 2. Memilih ID sumber yang akan dieksekusi
 * 3. Assign driver dan kendaraan (opsional)
 * 4. Menentukan tanggal pelaksanaan DO
 * 
 * Status default untuk DO baru adalah 'Pending' (tidak perlu dipilih oleh Admin)
 * Data Customer, Rute, dan Barang akan terisi otomatis berdasarkan sumber yang dipilih
 */

const DeliveryOrderModal = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    title = 'Tambah Delivery Order',
    isLoading = false
}) => {
    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});

    const [jobOrders, setJobOrders] = useState([]);
    const [manifests, setManifests] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [isFetchingSources, setIsFetchingSources] = useState(false);

    // ✅ NEW: State for Job Orders within selected Manifest (LTL scenario)
    const [manifestJobOrders, setManifestJobOrders] = useState([]);
    const [isFetchingManifestJOs, setIsFetchingManifestJOs] = useState(false);

    // Fetch available sources and options when modal opens
    useEffect(() => {
        if (isOpen) {
            const fetchSourcesAndOptions = async () => {
                setIsFetchingSources(true);
                try {
                    // First, fetch existing Delivery Orders to know which JO/Manifest are already used
                    const doResponse = await import('../../features/orders/services/deliveryOrderService').then(module => module.fetchDeliveryOrders({ per_page: 500 }));
                    const existingDOs = doResponse.items || [];

                    // Extract source_ids that are already used (only for Job Orders)
                    // Note: Manifests are NOT filtered because 1 Manifest can produce multiple DOs
                    const usedJobOrderIds = new Set(
                        existingDOs
                            .filter(d => d.source_type === 'JO')
                            .map(d => d.source_id)
                    );

                    console.log('[DeliveryOrderModal] Used Job Order IDs:', [...usedJobOrderIds]);
                    // Note: We no longer track usedManifestIds because 1 Manifest can produce multiple DOs

                    // Fetch Job Orders and filter out those already used
                    const joResponse = await import('../../features/orders/services/jobOrderService').then(module => module.fetchJobOrders({ per_page: 100 }));
                    const joOptions = joResponse.items
                        .filter(jo => !usedJobOrderIds.has(jo.job_order_id)) // Exclude already used
                        .map(jo => ({
                            value: jo.job_order_id,
                            label: `${jo.job_order_id} - ${jo.customer?.customer_name || 'Unknown Customer'}`,
                            details: jo // Store full details for auto-fill logic
                        }));
                    setJobOrders(joOptions);
                    console.log('[DeliveryOrderModal] Job Orders available (after filter):', joOptions.length, 'items');

                    // ✅ UPDATED: Fetch ALL Manifests (don't filter by usedManifestIds)
                    // 1 Manifest LTL can generate MULTIPLE Delivery Orders (1 per Job Order)
                    // The filtering happens at the Job Order level, not Manifest level
                    const mfResponse = await import('../../features/manifests/services/manifestService').then(module => module.fetchManifests({ per_page: 100 }));
                    const mfOptions = mfResponse.items
                        // ✅ Filter out Cancelled manifests and manifests without job_orders
                        .filter(mf => {
                            const isCancelled = mf.status?.toLowerCase() === 'cancelled';
                            const hasJobOrders = mf.job_orders && Array.isArray(mf.job_orders) && mf.job_orders.length > 0;
                            return !isCancelled && hasJobOrders;
                        })
                        .map(mf => ({
                            value: mf.manifest_id,
                            label: `${mf.manifest_id} (${mf.job_orders?.length || '?'} muatan)`,  // Show manifest ID with job order count
                            details: mf // Store full details for auto-fill logic (driver_id, vehicle_id, drivers, vehicles, job_orders)
                        }));
                    setManifests(mfOptions);
                    console.log('[DeliveryOrderModal] Manifests available (excluding cancelled):', mfOptions.length, 'items');

                    // Fetch ALL Drivers (tanpa filter status agar semua driver tersedia)
                    const driverRes = await fetchDrivers({ per_page: 200 });
                    const driverOptions = (driverRes.items || []).map(d => ({
                        value: d.driver_id,
                        label: d.driver_name
                    }));
                    setDrivers(driverOptions);
                    console.log('[DeliveryOrderModal] Drivers loaded:', driverOptions);

                    // Fetch ALL Vehicles (tanpa filter status agar semua vehicle tersedia)
                    const vehicleRes = await fetchVehicles({ per_page: 200 });
                    const vehicleOptions = (vehicleRes.items || []).map(v => ({
                        value: v.vehicle_id,
                        label: `${v.plate_no} - ${v.vehicle_type?.name || v.brand || ''}`
                    }));
                    setVehicles(vehicleOptions);
                    console.log('[DeliveryOrderModal] Vehicles loaded:', vehicleOptions);

                } catch (error) {
                    console.error('Failed to fetch sources or options:', error);
                } finally {
                    setIsFetchingSources(false);
                }
            };

            fetchSourcesAndOptions();
        }
    }, [isOpen]);

    // Initialize form data when modal opens
    useEffect(() => {
        if (isOpen) {
            const newFormData = {
                source_type: initialData?.source_type || '',
                source_id: initialData?.source_id || '',
                do_date: initialData?.do_date || '',
                departure_date: initialData?.departure_date || '',
                driver_id: initialData?.driver_id || '',
                vehicle_id: initialData?.vehicle_id || '',
                notes: initialData?.notes || ''
            };
            setFormData(newFormData);
            setErrors({});
        }
    }, [isOpen, initialData]);

    // Auto-fill Driver & Vehicle when selecting Job Order OR Manifest
    // Logic: Check if selected source has assigned driver/vehicle
    // - Kondisi A (Sudah ada Driver/Vehicle): Auto-fill form
    // - Kondisi B (Belum ada Driver/Vehicle): Form kosong, Admin pilih manual
    useEffect(() => {
        // Only run when we have all the necessary data loaded
        if (formData.source_type && formData.source_id && drivers.length > 0 && vehicles.length > 0) {

            if (formData.source_type === 'JO' && jobOrders.length > 0) {
                // Handle Job Order source
                const selectedSource = jobOrders.find(jo => jo.value === formData.source_id);
                if (selectedSource && selectedSource.details) {
                    const jobDetails = selectedSource.details;

                    // Get driver and vehicle from assignments (active assignment first)
                    const assignments = Array.isArray(jobDetails.assignments) ? jobDetails.assignments : [];
                    const activeAssignment = assignments.find(a => a.status === 'Active') || assignments[0];

                    // Priority: activeAssignment > jobDetails field (for backward compatibility)
                    let driverId = activeAssignment?.driver_id || activeAssignment?.driver?.driver_id || jobDetails.assigned_driver_id || jobDetails.driver_id || '';
                    let vehicleId = activeAssignment?.vehicle_id || activeAssignment?.vehicle?.vehicle_id || jobDetails.assigned_vehicle_id || jobDetails.vehicle_id || '';

                    // Validate that the IDs exist in the options
                    const driverExists = drivers.some(d => d.value === driverId);
                    const vehicleExists = vehicles.some(v => v.value === vehicleId);

                    console.log('[DeliveryOrderModal] Auto-fill check for JO:', {
                        job_order_id: formData.source_id,
                        jobDetails: jobDetails,
                        assignments: assignments,
                        activeAssignment: activeAssignment,
                        driverId: driverId,
                        vehicleId: vehicleId,
                        driverExists: driverExists,
                        vehicleExists: vehicleExists
                    });

                    // Auto-fill if driver/vehicle exists in options
                    setFormData(prev => ({
                        ...prev,
                        driver_id: driverExists ? driverId : '',
                        vehicle_id: vehicleExists ? vehicleId : ''
                    }));
                }
            } else if (formData.source_type === 'MF' && manifests.length > 0) {
                // Handle Manifest source - Manifest PASTI punya driver & vehicle
                const selectedManifest = manifests.find(mf => mf.value === formData.source_id);
                if (selectedManifest && selectedManifest.details) {
                    const manifestDetails = selectedManifest.details;

                    // Get driver and vehicle from manifest
                    // Priority: drivers relation > driver_id field
                    let driverId = manifestDetails.drivers?.driver_id || manifestDetails.driver_id || '';
                    let vehicleId = manifestDetails.vehicles?.vehicle_id || manifestDetails.vehicle_id || '';

                    // Validate that the IDs exist in the options
                    const driverExists = drivers.some(d => d.value === driverId);
                    const vehicleExists = vehicles.some(v => v.value === vehicleId);

                    console.log('[DeliveryOrderModal] Auto-fill check for Manifest:', {
                        manifest_id: formData.source_id,
                        manifestDetails: manifestDetails,
                        driverId: driverId,
                        vehicleId: vehicleId,
                        driverExists: driverExists,
                        vehicleExists: vehicleExists,
                        availableDrivers: drivers.map(d => d.value)
                    });

                    // Auto-fill driver & vehicle from Manifest (should always exist for Manifest)
                    setFormData(prev => ({
                        ...prev,
                        driver_id: driverExists ? driverId : '',
                        vehicle_id: vehicleExists ? vehicleId : ''
                    }));
                }
            }
        }
    }, [formData.source_id, formData.source_type, jobOrders, manifests, drivers, vehicles]);

    // ✅ NEW: Fetch Job Orders when a Manifest is selected (for LTL scenario)
    useEffect(() => {
        const fetchManifestJobOrders = async () => {
            // Only fetch if Manifest is selected
            if (formData.source_type === 'MF' && formData.source_id) {
                setIsFetchingManifestJOs(true);
                try {
                    // Find the selected manifest to get its job_orders
                    const selectedManifest = manifests.find(mf => mf.value === formData.source_id);

                    if (selectedManifest?.details?.job_orders) {
                        // Manifest already has job_orders loaded
                        const joOptions = selectedManifest.details.job_orders.map(jo => ({
                            value: jo.job_order_id,
                            label: `${jo.job_order_id} | ${jo.customer?.customer_name || jo.customer_name || 'Unknown'} | ${jo.delivery_city || jo.delivery_address?.substring(0, 30) || '-'}`,
                            details: jo
                        }));
                        setManifestJobOrders(joOptions);
                        console.log('[DeliveryOrderModal] Job Orders from Manifest (cached):', joOptions);
                    } else {
                        // Need to fetch manifest details with job orders
                        const manifestService = await import('../../features/manifests/services/manifestService');
                        const manifestDetails = await manifestService.getManifest(formData.source_id);

                        if (manifestDetails?.job_orders) {
                            const joOptions = manifestDetails.job_orders.map(jo => ({
                                value: jo.job_order_id,
                                label: `${jo.job_order_id} | ${jo.customer?.customer_name || jo.customer_name || 'Unknown'} | ${jo.delivery_city || jo.delivery_address?.substring(0, 30) || '-'}`,
                                details: jo
                            }));
                            setManifestJobOrders(joOptions);
                            console.log('[DeliveryOrderModal] Job Orders from Manifest (fetched):', joOptions);
                        } else {
                            setManifestJobOrders([]);
                        }
                    }
                } catch (error) {
                    console.error('[DeliveryOrderModal] Failed to fetch manifest job orders:', error);
                    setManifestJobOrders([]);
                } finally {
                    setIsFetchingManifestJOs(false);
                }
            } else {
                // Clear manifest job orders if not Manifest source
                setManifestJobOrders([]);
            }
        };

        fetchManifestJobOrders();
    }, [formData.source_id, formData.source_type, manifests]);

    // Handle input change
    const handleChange = (name, value) => {
        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            // Reset source selection when source type changes
            if (name === 'source_type') {
                newData.source_id = '';
                newData.selected_job_order_id = ''; // ✅ Reset job order selection
            }

            // ✅ Reset job order selection when manifest changes
            if (name === 'source_id' && prev.source_type === 'MF') {
                newData.selected_job_order_id = '';
            }

            return newData;
        });

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

        if (!formData.source_type) {
            newErrors.source_type = 'Tipe sumber harus dipilih';
        }

        if (!formData.source_id) {
            newErrors.source_id = 'Sumber harus dipilih';
        }

        // ✅ NEW: Require job order selection for Manifest source
        if (formData.source_type === 'MF' && !formData.selected_job_order_id) {
            newErrors.selected_job_order_id = 'Pilih muatan/job order dari manifest ini';
        }

        if (!formData.do_date) {
            newErrors.do_date = 'Tanggal DO harus diisi';
        }

        // ✅ REMOVED: Driver & Vehicle validation for Job Order source
        // Karena field Driver dan Kendaraan sekarang read-only (otomatis dari Assignment/Manifest),
        // validasi manual tidak diperlukan lagi. Jika sumber belum memiliki driver/vehicle,
        // admin harus melakukan assignment terlebih dahulu di halaman Job Order atau Manifest.

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submit
    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            await onSubmit(formData);
        } catch (error) {
            console.error('Error submitting form:', error);
        }
    };

    // Render input field
    const renderField = (field) => {
        const { name, label, type, required, options, placeholder, description, help, disabled: fieldDisabled } = field;
        const value = formData[name] || '';
        const hasError = errors[name];
        const isDisabled = isLoading || fieldDisabled;

        const commonProps = {
            id: name,
            name: name,
            value: value,
            onChange: (e) => handleChange(name, e.target.value),
            className: `
                w-full rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                placeholder:text-slate-400
                ${hasError
                    ? 'border-red-300 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500'
                    : isDisabled
                        ? 'border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed'
                        : value
                            ? 'border-green-300 bg-green-50/50 text-slate-900 focus:border-indigo-500'
                            : 'border-slate-300 bg-white text-slate-900 hover:border-slate-400 focus:bg-indigo-50/50'
                }
            `,
            disabled: isDisabled
        };

        return (
            <div key={name} className="group field-wrapper">
                <label
                    htmlFor={name}
                    className="mb-3 block text-sm font-semibold text-slate-700 group-focus-within:text-indigo-600 transition-colors"
                >
                    {label}
                    {required && (
                        <span className="ml-1 text-red-500 font-medium">*</span>
                    )}
                </label>

                <div className="relative">
                    {type === 'readonly_summary' ? (
                        // ✅ NEW: Read-only summary card for Job Order verification
                        <div className="rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="col-span-2">
                                    <span className="text-slate-500 font-medium">Customer:</span>
                                    <p className="text-slate-800 font-semibold">{field.summaryData?.customer || '-'}</p>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-slate-500 font-medium">Tujuan:</span>
                                    <p className="text-slate-800 font-semibold truncate">{field.summaryData?.destination || '-'}</p>
                                </div>
                                <div>
                                    <span className="text-slate-500 font-medium">Berat:</span>
                                    <p className="text-slate-800 font-bold text-lg">{field.summaryData?.weight || 0} <span className="text-xs font-normal">Kg</span></p>
                                </div>
                                <div>
                                    <span className="text-slate-500 font-medium">Koli:</span>
                                    <p className="text-slate-800 font-bold text-lg">{field.summaryData?.koli || 0} <span className="text-xs font-normal">Koli</span></p>
                                </div>
                                <div>
                                    <span className="text-slate-500 font-medium">Volume:</span>
                                    <p className="text-slate-800 font-bold text-lg">{field.summaryData?.volume || 0} <span className="text-xs font-normal">m³</span></p>
                                </div>
                                <div className="col-span-2 pt-2 border-t border-amber-200">
                                    <span className="text-slate-500 font-medium">Deskripsi Barang:</span>
                                    <p className="text-slate-700 italic">{field.summaryData?.description || '-'}</p>
                                </div>
                            </div>
                        </div>
                    ) : type === 'select' ? (
                        <select {...commonProps}>
                            <option value="">-- Pilih {label} --</option>
                            {options?.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    ) : type === 'date' ? (
                        <input
                            {...commonProps}
                            type="date"
                        />
                    ) : type === 'textarea' ? (
                        <textarea
                            {...commonProps}
                            rows={field.rows || 3}
                            placeholder={placeholder}
                        />
                    ) : (
                        <input
                            {...commonProps}
                            type={type}
                            placeholder={placeholder}
                        />
                    )}

                    {/* Icon untuk field yang required dan sudah diisi */}
                    {required && !hasError && value && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <svg className="w-5 h-5 text-green-500 animate-checkmark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    )}
                </div>

                {hasError && (
                    <div className="mt-2 flex items-center gap-2 error-shake">
                        <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-red-600 font-medium">
                            {hasError}
                        </p>
                    </div>
                )}

                {description && (
                    <p className="mt-2 text-xs text-slate-500 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-2 rounded-lg border border-blue-200">
                        ℹ️ {description}
                    </p>
                )}

                {help && (
                    <p className="mt-2 text-xs text-slate-500 bg-gradient-to-r from-slate-50 to-blue-50 px-3 py-2 rounded-lg border border-slate-200">
                        💡 {help}
                    </p>
                )}
            </div>
        );
    };

    // Get current fields based on form state
    const getCurrentFields = () => {
        const fields = [
            {
                name: 'source_type',
                label: 'Tipe Sumber',
                type: 'select',
                required: true,
                options: [
                    { value: 'JO', label: 'Job Order' },
                    { value: 'MF', label: 'Manifest' }
                ],
                description: 'Pilih apakah DO ini dibuat dari Job Order atau Manifest yang sudah ada'
            }
        ];

        // Add source selection field if type is selected
        if (formData.source_type) {
            fields.push({
                name: 'source_id',
                label: formData.source_type === 'JO' ? 'Job Order' : 'Manifest',
                type: 'select',
                required: true,
                options: formData.source_type === 'JO' ? jobOrders : manifests,
                description: `Data Customer, Rute, dan Barang akan terisi otomatis berdasarkan ${formData.source_type === 'JO' ? 'Job Order' : 'Manifest'} yang dipilih`
            });
        }

        // ✅ NEW: Add Job Order Summary (Read-Only) for visual verification
        // Menampilkan summary barang setelah memilih Job Order agar Admin bisa melakukan
        // verifikasi visual terakhir bahwa JO yang dipilih benar-benar membawa muatan yang dimaksud
        if (formData.source_type === 'JO' && formData.source_id) {
            const selectedJobOrder = jobOrders.find(jo => jo.value === formData.source_id);
            if (selectedJobOrder?.details) {
                const jo = selectedJobOrder.details;
                const weight = jo.weight || jo.goods_weight || 0;
                const koli = jo.koli || jo.goods_qty || jo.quantity || 0;
                const volume = jo.volume || jo.goods_volume || 0;
                const description = jo.goods_desc || jo.goods_description || jo.description || jo.notes || '-';
                const customerName = jo.customer?.customer_name || jo.customer_name || '-';
                const deliveryAddress = jo.delivery_address || '-';

                fields.push({
                    name: 'job_order_summary',
                    label: '📋 Summary Barang (Verifikasi)',
                    type: 'readonly_summary',
                    summaryData: {
                        customer: customerName,
                        destination: deliveryAddress,
                        weight: weight,
                        koli: koli,
                        volume: volume,
                        description: description
                    },
                    description: 'Data barang dari Job Order yang dipilih. Pastikan data ini sesuai sebelum menyimpan.'
                });
            }
        }

        // ✅ NEW: Add Job Order selection field for Manifest source (LTL scenario)
        // This is CRITICAL for LTL - allows creating separate DO per customer/destination
        if (formData.source_type === 'MF' && formData.source_id) {
            fields.push({
                name: 'selected_job_order_id',
                label: '📦 Pilih Muatan / Job Order',
                type: 'select',
                required: true,
                options: manifestJobOrders,
                description: isFetchingManifestJOs
                    ? '⏳ Memuat daftar muatan...'
                    : manifestJobOrders.length > 0
                        ? '⚠️ WAJIB dipilih untuk LTL! 1 Manifest bisa jadi beberapa Surat Jalan berdasarkan tujuan/customer.'
                        : '❌ Manifest ini tidak memiliki Job Order',
                help: 'Satu Manifest LTL bisa memiliki beberapa muatan dengan tujuan berbeda. Pilih muatan spesifik untuk Surat Jalan ini.'
            });
        }

        // Add date field
        fields.push({
            name: 'do_date',
            label: 'Tanggal DO',
            type: 'date',
            required: true,
            description: 'Tanggal ketika Delivery Order ini dibuat'
        });

        // Add departure date field (Tanggal Keberangkatan)
        fields.push({
            name: 'departure_date',
            label: 'Tanggal Keberangkatan',
            type: 'date',
            required: false,
            description: 'Tanggal keberangkatan armada untuk pengiriman ini'
        });

        // Check if selected source has existing driver/vehicle assignment
        let hasDriverAssignment = false;
        let hasVehicleAssignment = false;
        let isManifestSource = formData.source_type === 'MF';

        if (formData.source_type === 'JO' && formData.source_id) {
            const selectedSource = jobOrders.find(jo => jo.value === formData.source_id);
            if (selectedSource && selectedSource.details) {
                const d = selectedSource.details;
                const assignments = Array.isArray(d.assignments) ? d.assignments : [];
                const activeAssignment = assignments.find(a => a.status === 'Active') || assignments[0];

                hasDriverAssignment = !!(activeAssignment?.driver_id || activeAssignment?.driver?.driver_id || d.assigned_driver_id || d.driver_id);
                hasVehicleAssignment = !!(activeAssignment?.vehicle_id || activeAssignment?.vehicle?.vehicle_id || d.assigned_vehicle_id || d.vehicle_id);
            }
        } else if (formData.source_type === 'MF' && formData.source_id) {
            // Manifest source - check if manifest has driver/vehicle
            const selectedManifest = manifests.find(mf => mf.value === formData.source_id);
            if (selectedManifest && selectedManifest.details) {
                const m = selectedManifest.details;
                hasDriverAssignment = !!(m.drivers?.driver_id || m.driver_id);
                hasVehicleAssignment = !!(m.vehicles?.vehicle_id || m.vehicle_id);
            }
        }

        // Add Driver & Vehicle fields
        // ✅ UPDATED: Both Job Order and Manifest - auto-filled AND disabled (read-only)
        // Driver dan Kendaraan diambil otomatis dari Assignment (Job Order) atau dari Manifest
        // Admin tidak perlu memilih manual, data mengikuti sumber yang dipilih
        const hasSourceSelected = formData.source_type && formData.source_id;

        // Get driver and vehicle display name for read-only display
        const getDriverDisplayName = () => {
            if (formData.driver_id) {
                const driver = drivers.find(d => d.value === formData.driver_id);
                return driver?.label || formData.driver_id;
            }
            return 'Belum ada driver';
        };

        const getVehicleDisplayName = () => {
            if (formData.vehicle_id) {
                const vehicle = vehicles.find(v => v.value === formData.vehicle_id);
                return vehicle?.label || formData.vehicle_id;
            }
            return 'Belum ada kendaraan';
        };

        fields.push({
            name: 'driver_id',
            label: isManifestSource ? 'Driver (dari Manifest)' : 'Driver (dari Job Order)',
            type: 'select',
            required: false, // Not required since it's auto-filled from source
            disabled: hasSourceSelected, // ✅ Always disabled when source is selected
            options: [{ value: '', label: '-- Pilih Assign Driver --' }, ...drivers],
            description: hasSourceSelected
                ? `🔒 ${getDriverDisplayName()} - Otomatis dari ${isManifestSource ? 'Manifest' : 'Assignment Job Order'}`
                : 'Pilih sumber terlebih dahulu'
        });

        fields.push({
            name: 'vehicle_id',
            label: isManifestSource ? 'Kendaraan (dari Manifest)' : 'Kendaraan (dari Job Order)',
            type: 'select',
            required: false, // Not required since it's auto-filled from source
            disabled: hasSourceSelected, // ✅ Always disabled when source is selected
            options: [{ value: '', label: '-- Pilih Assign Kendaraan --' }, ...vehicles],
            description: hasSourceSelected
                ? `🔒 ${getVehicleDisplayName()} - Otomatis dari ${isManifestSource ? 'Manifest' : 'Assignment Job Order'}`
                : 'Pilih sumber terlebih dahulu'
        });

        // Add Notes field (Catatan Tambahan)
        fields.push({
            name: 'notes',
            label: 'Catatan Tambahan',
            type: 'textarea',
            required: false,
            placeholder: 'Catatan tambahan untuk delivery order ini...',
            description: 'Catatan khusus untuk driver atau tim operasional'
        });

        return fields;
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="lg"
            closeOnBackdropClick={!isLoading}
            backdropOpacity="default"
            disableScroll={true}
            hideContentScrollbar={false}
        >
            <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
                {/* Scrollable form fields dengan desain yang lebih menarik */}
                <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar max-h-[60vh]">
                    {getCurrentFields().map((field, index) => {
                        const staggerClass = `field-stagger-${Math.min(index + 1, 8)}`;
                        return (
                            <div key={field.name} className={`${staggerClass}`}>
                                {renderField(field)}
                            </div>
                        );
                    })}
                </div>

                {/* Fixed action buttons dengan desain yang lebih menarik */}
                <div className="flex justify-end gap-4 border-t border-slate-200 pt-6 mt-8 shrink-0 bg-gradient-to-r from-slate-50 to-white px-1">
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
                            {isLoading ? 'Menyimpan...' : '✨ Simpan Delivery Order'}
                        </span>
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default DeliveryOrderModal;