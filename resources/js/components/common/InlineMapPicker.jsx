import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Search, Crosshair, MapPin } from 'lucide-react';

// Marker Icon Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Default Marker Icon
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Component to handle map click events
function LocationMarker({ position, setPosition, onReverseGeocode }) {
    useMapEvents({
        click(e) {
            const newPos = {
                lat: e.latlng.lat,
                lng: e.latlng.lng
            };
            setPosition(newPos);

            // ✅ Trigger reverse geocoding when user clicks on map
            if (onReverseGeocode && typeof onReverseGeocode === 'function') {
                onReverseGeocode(newPos);
            }
        },
    });

    return position ? (
        <Marker position={[position.lat, position.lng]} />
    ) : null;
}

// Component to fly to position
function FlyToPosition({ position }) {
    const map = useMap();

    useEffect(() => {
        if (position) {
            map.flyTo([position.lat, position.lng], 16);
        }
    }, [position, map]);

    return null;
}

// Component to handle current location
function CurrentLocationButton({ setPosition, onReverseGeocode }) {
    const map = useMap();

    const handleClick = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const newPos = {
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    };
                    setPosition(newPos);
                    map.flyTo([newPos.lat, newPos.lng], 16);

                    // ✅ Trigger reverse geocoding when user uses current location
                    if (onReverseGeocode && typeof onReverseGeocode === 'function') {
                        onReverseGeocode(newPos);
                    }
                },
                (err) => {
                    console.error('Error getting location:', err);
                    alert('Tidak dapat mengakses lokasi. Pastikan GPS diaktifkan.');
                }
            );
        } else {
            alert('Browser tidak mendukung geolocation.');
        }
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className="absolute bottom-4 right-4 z-[1000] bg-white p-2 rounded-full shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            title="Gunakan lokasi saat ini"
        >
            <Crosshair className="h-4 w-4 text-indigo-600" />
        </button>
    );
}

/**
 * InlineMapPicker - Komponen peta inline yang ditampilkan di dalam form
 * 
 * @param {object} position - Posisi saat ini {lat, lng}
 * @param {function} onPositionChange - Callback saat posisi berubah
 * @param {function} onAddressChange - Callback saat alamat berubah (dari reverse geocoding)
 * @param {function} onCityChange - Callback saat kota berubah (dari reverse geocoding)
 * @param {string} type - Tipe lokasi: 'pickup' atau 'delivery'
 * @param {boolean} disabled - Apakah picker disabled
 * @param {string} address - Alamat yang akan di-geocode otomatis
 */
const InlineMapPicker = ({
    position,
    onPositionChange,
    onAddressChange,
    onCityChange,
    type = 'pickup',
    disabled = false,
    address = ''
}) => {
    // Default center: Indonesia (Jakarta)
    const defaultCenter = { lat: -6.2088, lng: 106.8456 };

    const [internalPosition, setInternalPosition] = useState(
        position?.lat && position?.lng ? position : null
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
    const [geocodeStatus, setGeocodeStatus] = useState(''); // 'success', 'error', ''
    const mapRef = useRef(null);
    const geocodeTimeoutRef = useRef(null);
    const lastGeocodedAddressRef = useRef('');

    // Keep track of internal position for comparison without adding to dependencies
    const internalPositionRef = useRef(internalPosition);
    useEffect(() => {
        internalPositionRef.current = internalPosition;
    }, [internalPosition]);

    // Update internal position when prop changes
    useEffect(() => {
        if (position?.lat && position?.lng) {
            // Check if position is effectively different from current internal position
            // This prevents infinite loops and redundant updates that cause map "stuttering"
            const currentInternal = internalPositionRef.current;
            const hasChanged = !currentInternal ||
                Math.abs(position.lat - currentInternal.lat) > 0.00001 ||
                Math.abs(position.lng - currentInternal.lng) > 0.00001;

            if (hasChanged) {
                setInternalPosition(position);
            }
        }
    }, [position]);

    // Notify parent when position changes
    useEffect(() => {
        if (internalPosition) {
            onPositionChange(internalPosition);
        }
    }, [internalPosition]);

    // Geocode address when it changes (with debounce)
    useEffect(() => {
        // Clear any pending geocode request
        if (geocodeTimeoutRef.current) {
            clearTimeout(geocodeTimeoutRef.current);
        }

        // Only geocode if address is provided and has changed
        if (!address || address.trim().length < 5) {
            return;
        }

        // Skip if already geocoded this address
        if (address === lastGeocodedAddressRef.current) {
            return;
        }

        // Debounce geocoding - wait 1.5 seconds after user stops typing
        geocodeTimeoutRef.current = setTimeout(async () => {
            await geocodeAddress(address);
        }, 1500);

        return () => {
            if (geocodeTimeoutRef.current) {
                clearTimeout(geocodeTimeoutRef.current);
            }
        };
    }, [address]);

    // Geocode address function
    const geocodeAddress = async (addressToGeocode) => {
        if (!addressToGeocode || addressToGeocode.trim().length < 5) return;

        setIsGeocodingAddress(true);
        setGeocodeStatus('');

        try {
            // Add "Indonesia" to search query for better local results
            const query = addressToGeocode.includes('Indonesia')
                ? addressToGeocode
                : `${addressToGeocode}, Indonesia`;

            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
            );
            const data = await response.json();

            if (data && data.length > 0) {
                const result = data[0];
                const newPos = {
                    lat: parseFloat(result.lat),
                    lng: parseFloat(result.lon)
                };
                setInternalPosition(newPos);
                setGeocodeStatus('success');
                lastGeocodedAddressRef.current = addressToGeocode;

                // Auto expand map to show the location
                if (!isExpanded) {
                    setIsExpanded(true);
                }

                console.log(`📍 Geocoded "${addressToGeocode}" to:`, newPos);
            } else {
                setGeocodeStatus('error');
                console.log(`❌ Could not geocode: "${addressToGeocode}"`);
            }
        } catch (error) {
            console.error('Error geocoding address:', error);
            setGeocodeStatus('error');
        } finally {
            setIsGeocodingAddress(false);
        }
    };

    // ✅ NEW: Reverse Geocode function - Koordinat ke Alamat
    const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
    const [reverseGeocodeStatus, setReverseGeocodeStatus] = useState(''); // 'success', 'error', ''

    const reverseGeocode = async (coords) => {
        if (!coords?.lat || !coords?.lng) return;

        setIsReverseGeocoding(true);
        setReverseGeocodeStatus('');

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=18&addressdetails=1`
            );
            const data = await response.json();

            if (data && data.address) {
                // Ekstrak informasi alamat
                const addressParts = [];

                // Ambil detail alamat (dari yang paling spesifik ke umum)
                if (data.address.road) addressParts.push(data.address.road);
                if (data.address.house_number) addressParts[0] = `${data.address.road} No. ${data.address.house_number}`;
                if (data.address.neighbourhood) addressParts.push(data.address.neighbourhood);
                if (data.address.suburb) addressParts.push(data.address.suburb);
                if (data.address.village) addressParts.push(data.address.village);
                if (data.address.city_district) addressParts.push(data.address.city_district);

                // Buat alamat lengkap
                const fullAddress = addressParts.length > 0
                    ? addressParts.join(', ')
                    : data.display_name.split(',').slice(0, 4).join(',');

                // Ekstrak nama kota
                const city = data.address.city
                    || data.address.town
                    || data.address.municipality
                    || data.address.county
                    || data.address.state
                    || '';

                console.log(`🔄 Reverse geocoded to: "${fullAddress}" | City: "${city}"`);

                // Panggil callback untuk update alamat di parent form
                if (onAddressChange && typeof onAddressChange === 'function') {
                    onAddressChange(fullAddress);
                }

                // Panggil callback untuk update kota di parent form
                if (onCityChange && typeof onCityChange === 'function') {
                    onCityChange(city);
                }

                // Update ref agar tidak trigger geocode lagi
                lastGeocodedAddressRef.current = fullAddress;

                setReverseGeocodeStatus('success');
            } else {
                console.log('❌ Reverse geocode: No address found');
                setReverseGeocodeStatus('error');
            }
        } catch (error) {
            console.error('Error reverse geocoding:', error);
            setReverseGeocodeStatus('error');
        } finally {
            setIsReverseGeocoding(false);
        }
    };

    // Manual geocode from address button
    const handleGeocodeFromAddress = () => {
        if (address && address.trim().length >= 5) {
            lastGeocodedAddressRef.current = ''; // Force re-geocode
            geocodeAddress(address);
        }
    };

    // Search location using Nominatim (OpenStreetMap geocoding)
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        setSearchResults([]);

        try {
            // Add "Indonesia" to search query for better local results
            const query = searchQuery.includes('Indonesia')
                ? searchQuery
                : `${searchQuery}, Indonesia`;

            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
            );
            const data = await response.json();

            if (data && data.length > 0) {
                setSearchResults(data);
            } else {
                setSearchResults([]);
            }
        } catch (error) {
            console.error('Error searching location:', error);
        } finally {
            setIsSearching(false);
        }
    };

    // Handle search result selection
    const handleSelectSearchResult = (result) => {
        const newPos = {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon)
        };
        setInternalPosition(newPos);
        setSearchResults([]);
        setSearchQuery(result.display_name.split(',').slice(0, 3).join(','));
    };

    const colorClasses = type === 'pickup'
        ? {
            border: 'border-emerald-200',
            bg: 'bg-emerald-50',
            text: 'text-emerald-700',
            hoverBg: 'hover:bg-emerald-100',
            focusRing: 'focus:ring-emerald-500',
            badgeBg: 'bg-emerald-100',
            badgeText: 'text-emerald-800'
        }
        : {
            border: 'border-sky-200',
            bg: 'bg-sky-50',
            text: 'text-sky-700',
            hoverBg: 'hover:bg-sky-100',
            focusRing: 'focus:ring-sky-500',
            badgeBg: 'bg-sky-100',
            badgeText: 'text-sky-800'
        };

    return (
        <div className={`rounded-xl border-2 ${colorClasses.border} overflow-hidden ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
            {/* Header - Click to expand/collapse */}
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className={`w-full flex items-center justify-between px-4 py-3 ${colorClasses.bg} ${colorClasses.hoverBg} transition-colors`}
            >
                <div className="flex items-center gap-2">
                    <svg className={`w-4 h-4 ${colorClasses.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className={`text-sm font-medium ${colorClasses.text}`}>
                        {isExpanded ? 'Sembunyikan Peta' : 'Tampilkan Peta untuk Pilih Lokasi'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {isGeocodingAddress && (
                        <span className="text-xs text-amber-600 flex items-center gap-1">
                            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Mencari...
                        </span>
                    )}
                    {internalPosition && !isGeocodingAddress && (
                        <span className={`text-xs px-2 py-1 rounded-full ${colorClasses.badgeBg} ${colorClasses.badgeText}`}>
                            ✓ Sudah dipilih
                        </span>
                    )}
                    <svg
                        className={`w-4 h-4 ${colorClasses.text} transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {/* Expandable Map Section */}
            {isExpanded && (
                <div className="border-t border-slate-200">
                    {/* Geocode from Address Button */}
                    {address && (
                        <div className="px-4 py-2 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-slate-100">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-slate-500 truncate">
                                        Alamat: <span className="font-medium text-slate-700">{address}</span>
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleGeocodeFromAddress}
                                    disabled={isGeocodingAddress || !address || address.length < 5}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                >
                                    <MapPin className="w-3.5 h-3.5" />
                                    {isGeocodingAddress ? 'Mencari...' : 'Cari Alamat di Peta'}
                                </button>
                            </div>
                            {geocodeStatus === 'success' && (
                                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Lokasi ditemukan dan peta sudah diperbarui
                                </p>
                            )}
                            {geocodeStatus === 'error' && (
                                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    Alamat tidak ditemukan. Coba klik manual di peta atau gunakan pencarian.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Search Bar */}
                    <div className="px-4 py-3 bg-white border-b border-slate-100">
                        <div className="relative">
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                        placeholder="Atau cari alamat lain..."
                                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm"
                                    />
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSearch}
                                    disabled={isSearching}
                                    className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50"
                                >
                                    {isSearching ? '...' : 'Cari'}
                                </button>
                            </div>

                            {/* Search Results Dropdown */}
                            {searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-slate-200 z-10 max-h-40 overflow-y-auto">
                                    {searchResults.map((result, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => handleSelectSearchResult(result)}
                                            className="w-full px-3 py-2 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                                        >
                                            <p className="text-sm font-medium text-slate-800 line-clamp-1">
                                                {result.display_name.split(',').slice(0, 2).join(',')}
                                            </p>
                                            <p className="text-xs text-slate-500 line-clamp-1">
                                                {result.display_name}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Map Container */}
                    <div className="relative h-[250px]">
                        <MapContainer
                            ref={mapRef}
                            center={internalPosition ? [internalPosition.lat, internalPosition.lng] : [defaultCenter.lat, defaultCenter.lng]}
                            zoom={internalPosition ? 16 : 12}
                            scrollWheelZoom={true}
                            style={{ height: "100%", width: "100%" }}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <LocationMarker
                                position={internalPosition}
                                setPosition={setInternalPosition}
                                onReverseGeocode={reverseGeocode}
                            />
                            {internalPosition && <FlyToPosition position={internalPosition} />}
                            <CurrentLocationButton
                                setPosition={setInternalPosition}
                                onReverseGeocode={reverseGeocode}
                            />
                        </MapContainer>

                        {/* Click instruction overlay */}
                        {!internalPosition && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-slate-200">
                                    <p className="text-sm text-slate-600">👆 Klik di peta untuk memilih lokasi</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Coordinates Display */}
                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                            <div className="flex gap-4">
                                <div>
                                    <span className="text-xs text-slate-500">Latitude:</span>
                                    <span className="ml-1.5 text-sm font-mono font-medium text-slate-800">
                                        {internalPosition ? internalPosition.lat.toFixed(6) : '-'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-500">Longitude:</span>
                                    <span className="ml-1.5 text-sm font-mono font-medium text-slate-800">
                                        {internalPosition ? internalPosition.lng.toFixed(6) : '-'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Reverse Geocoding Status */}
                                {isReverseGeocoding && (
                                    <span className="text-xs text-amber-600 flex items-center gap-1">
                                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Mengisi alamat...
                                    </span>
                                )}
                                {!isReverseGeocoding && reverseGeocodeStatus === 'success' && (
                                    <span className="text-xs text-blue-600 flex items-center gap-1">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Alamat diperbarui
                                    </span>
                                )}
                                {/* Position Status */}
                                {internalPosition && !isReverseGeocoding && (
                                    <span className="text-xs text-green-600 flex items-center gap-1">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Lokasi dipilih
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InlineMapPicker;
