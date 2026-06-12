import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, X, Search, Crosshair } from 'lucide-react';

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

// Custom icon for pickup (green)
const PickupIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    className: 'pickup-marker'
});

// Custom icon for delivery (blue)
const DeliveryIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    className: 'delivery-marker'
});

// Component to handle map click events
function LocationMarker({ position, setPosition }) {
    useMapEvents({
        click(e) {
            setPosition({
                lat: e.latlng.lat,
                lng: e.latlng.lng
            });
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
function CurrentLocationButton({ setPosition }) {
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
            className="absolute bottom-4 right-4 z-[1000] bg-white p-2.5 rounded-full shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            title="Gunakan lokasi saat ini"
        >
            <Crosshair className="h-5 w-5 text-indigo-600" />
        </button>
    );
}

/**
 * MapPickerModal - Modal untuk memilih lokasi di peta Leaflet
 * 
 * @param {boolean} isOpen - Status modal terbuka/tertutup
 * @param {function} onClose - Callback saat modal ditutup
 * @param {function} onSelect - Callback saat lokasi dipilih dengan parameter {lat, lng}
 * @param {string} title - Judul modal (default: "Pilih Lokasi di Peta")
 * @param {string} type - Tipe lokasi: 'pickup' atau 'delivery'
 * @param {object} initialPosition - Posisi awal marker (opsional) {lat, lng}
 */
const MapPickerModal = ({
    isOpen,
    onClose,
    onSelect,
    title = "Pilih Lokasi di Peta",
    type = 'pickup',
    initialPosition = null
}) => {
    // Default center: Indonesia (Jakarta)
    const defaultCenter = { lat: -6.2088, lng: 106.8456 };

    const [position, setPosition] = useState(initialPosition || null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);

    // Update position when initialPosition changes
    useEffect(() => {
        if (initialPosition && initialPosition.lat && initialPosition.lng) {
            setPosition(initialPosition);
        }
    }, [initialPosition]);

    // Reset when modal opens
    useEffect(() => {
        if (isOpen) {
            if (initialPosition && initialPosition.lat && initialPosition.lng) {
                setPosition(initialPosition);
            }
            setSearchQuery('');
            setSearchResults([]);
        }
    }, [isOpen, initialPosition]);

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
                alert('Lokasi tidak ditemukan. Coba kata kunci lain.');
            }
        } catch (error) {
            console.error('Error searching location:', error);
            alert('Gagal mencari lokasi. Periksa koneksi internet Anda.');
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
        setPosition(newPos);
        setSearchResults([]);
        setSearchQuery(result.display_name.split(',').slice(0, 3).join(','));
    };

    // Handle confirm selection
    const handleConfirm = () => {
        if (position) {
            onSelect({
                lat: position.lat,
                lng: position.lng
            });
            onClose();
        } else {
            alert('Silakan pilih lokasi terlebih dahulu dengan mengklik di peta.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 1000001 }}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative z-10 w-full max-w-3xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className={`flex items-center justify-between px-6 py-4 border-b border-slate-200 ${type === 'pickup' ? 'bg-emerald-50' : 'bg-sky-50'
                    }`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${type === 'pickup'
                            ? 'bg-emerald-100 text-emerald-600'
                            : 'bg-sky-100 text-sky-600'
                            }`}>
                            <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
                            <p className="text-sm text-slate-500">
                                Klik di peta untuk memilih lokasi {type === 'pickup' ? 'penjemputan' : 'tujuan'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/50 transition-colors"
                    >
                        <X className="h-5 w-5 text-slate-400" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <div className="relative">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Cari alamat atau nama tempat..."
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm"
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            </div>
                            <button
                                type="button"
                                onClick={handleSearch}
                                disabled={isSearching}
                                className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50"
                            >
                                {isSearching ? 'Mencari...' : 'Cari'}
                            </button>
                        </div>

                        {/* Search Results Dropdown */}
                        {searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-200 z-10 max-h-48 overflow-y-auto">
                                {searchResults.map((result, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => handleSelectSearchResult(result)}
                                        className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
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
                <div className="relative h-[400px]">
                    <MapContainer
                        center={position ? [position.lat, position.lng] : [defaultCenter.lat, defaultCenter.lng]}
                        zoom={position ? 16 : 12}
                        scrollWheelZoom={true}
                        style={{ height: "100%", width: "100%" }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <LocationMarker position={position} setPosition={setPosition} />
                        {position && <FlyToPosition position={position} />}
                        <CurrentLocationButton setPosition={setPosition} />
                    </MapContainer>

                    {/* Coordinates Display */}
                    {position && (
                        <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg border border-slate-200">
                            <p className="text-xs text-slate-500 mb-1">Koordinat:</p>
                            <p className="text-sm font-mono font-medium text-slate-800">
                                {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
                    <p className="text-sm text-slate-500">
                        {position
                            ? `📍 Lokasi dipilih: ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`
                            : '⚠️ Klik di peta untuk memilih lokasi'
                        }
                    </p>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-slate-600 hover:text-slate-800 font-medium transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={!position}
                            className={`px-5 py-2.5 rounded-xl font-medium transition-all ${position
                                ? type === 'pickup'
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                    : 'bg-sky-600 text-white hover:bg-sky-700'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                        >
                            Konfirmasi Lokasi
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MapPickerModal;
