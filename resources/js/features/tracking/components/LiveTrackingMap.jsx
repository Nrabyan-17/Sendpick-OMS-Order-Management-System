import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Marker Icon Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

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

const LiveTrackingMap = () => {
    const [position, setPosition] = useState([-6.2088, 106.8456]); // Default Jakarta
    const [driverId, setDriverId] = useState('DRV-001');
    const [driverData, setDriverData] = useState({ speed: 45, updated_at: 'Just now' });

    return (
        // PENTING: Pastikan div pembungkus punya tinggi (height)
        <div style={{ height: "150%", width: "150%", borderRadius: "12px", overflow: "hidden", border: "1px solid #ddd" }}>

            <MapContainer center={position} zoom={13} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>

                {/* Gambar Peta OpenStreetMap */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Marker Driver */}
                <Marker position={position}>
                    <Popup>
                        <b>Driver ID: {driverId}</b> <br />
                        Kecepatan: {driverData ? `${driverData.speed} km/h` : '0 km/h'} <br />
                        Update: {driverData ? driverData.updated_at : '-'}
                    </Popup>
                </Marker>

            </MapContainer>
        </div>
    );
};

export default LiveTrackingMap;