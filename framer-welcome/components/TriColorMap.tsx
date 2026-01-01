'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CITIES_DATA } from '@/data/cities';

interface City {
    name: string;
    lat: number;
    lng: number;
    type: 'meetup' | 'trip';
    description?: string;
    members?: number;
}

interface TriColorMapProps {
    onCityClick: (city: City) => void;
}

// Inline styles for marker elements (injected into head)
const markerStyles = `
.map-marker {
    background: transparent !important;
    border: none !important;
}
.city-flag {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(8px);
    border-radius: 20px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.5);
    font-size: 12px;
    font-weight: 600;
    color: #2D1810;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    font-family: 'Poppins', sans-serif;
}
.city-flag:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.6);
}
.city-flag .flag-icon {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
}
.city-flag[data-type="meetup"] .flag-icon {
    background: linear-gradient(135deg, #FF9933, #FFB366);
    box-shadow: 0 0 8px rgba(255, 153, 51, 0.5);
}
.city-flag[data-type="trip"] .flag-icon {
    background: linear-gradient(135deg, #138808, #1FA855);
    box-shadow: 0 0 8px rgba(19, 136, 8, 0.5);
}
.leaflet-control-zoom {
    border: none !important;
    border-radius: 12px !important;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1) !important;
}
.leaflet-control-zoom a {
    background: rgba(255, 255, 255, 0.95) !important;
    color: #2D1810 !important;
    border: none !important;
    width: 36px !important;
    height: 36px !important;
    line-height: 36px !important;
    font-size: 18px !important;
    transition: all 0.2s ease !important;
}
.leaflet-control-zoom a:hover {
    background: #FF9933 !important;
    color: white !important;
}
@keyframes spin-tricolor {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
.spinner-tricolor {
    animation: spin-tricolor 1s linear infinite;
}
`;

export default function TriColorMap({ onCityClick }: TriColorMapProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<L.Map | null>(null);
    const markersRef = useRef<L.Marker[]>([]);
    const geoJsonLayersRef = useRef<L.GeoJSON[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Inject styles into head
    useEffect(() => {
        const styleId = 'tricolor-map-styles';
        if (!document.getElementById(styleId)) {
            const styleElement = document.createElement('style');
            styleElement.id = styleId;
            styleElement.textContent = markerStyles;
            document.head.appendChild(styleElement);
        }
        return () => {
            const existingStyle = document.getElementById(styleId);
            if (existingStyle) {
                existingStyle.remove();
            }
        };
    }, []);

    useEffect(() => {
        // Initialize map
        if (!map.current && mapContainer.current) {
            map.current = L.map(mapContainer.current, {
                zoomControl: true,
                attributionControl: false,
                scrollWheelZoom: true,
                dragging: true,
                touchZoom: true,
                minZoom: 4,
                maxZoom: 10,
                worldCopyJump: false
            }).setView([23.5937, 78.9629], 5);

            // Load India GeoJSON
            const loadIndiaGeoJSON = fetch('https://raw.githubusercontent.com/datameet/maps/master/Country/india-soi.geojson')
                .then(res => res.json())
                .then(data => {
                    const indiaLayer = L.geoJSON(data, {
                        style: {
                            fillColor: '#FEF7E4',
                            fillOpacity: 1,
                            color: '#D4A574',
                            weight: 2.5,
                            opacity: 0.8
                        }
                    }).addTo(map.current!);

                    geoJsonLayersRef.current.push(indiaLayer);

                    if (map.current) {
                        const bounds = indiaLayer.getBounds();
                        map.current.fitBounds(bounds, { padding: [50, 50] });
                    }
                });

            // Load state borders
            const loadStateBorders = fetch('https://raw.githubusercontent.com/datameet/maps/master/website/docs/data/geojson/states.geojson')
                .then(res => res.json())
                .then(data => {
                    const statesLayer = L.geoJSON(data, {
                        style: {
                            fillColor: 'transparent',
                            color: '#E8D5B7',
                            weight: 1.5,
                            opacity: 0.8
                        }
                    }).addTo(map.current!);

                    geoJsonLayersRef.current.push(statesLayer);
                });

            // Wait for both GeoJSON to load before adding markers
            Promise.all([loadIndiaGeoJSON, loadStateBorders])
                .then(() => {
                    // Add city markers
                    CITIES_DATA.forEach(city => {
                        const iconHtml = `
                            <div class="city-flag" data-type="${city.type}">
                                <span class="flag-icon"></span>
                                <span>${city.name}</span>
                            </div>
                        `;

                        const icon = L.divIcon({
                            className: 'map-marker',
                            html: iconHtml,
                            iconSize: [120, 32],
                            iconAnchor: [60, 32]
                        });

                        const marker = L.marker([city.lat, city.lng], { icon, title: city.name }).addTo(map.current!);

                        marker.on('click', () => {
                            onCityClick(city as City);
                        });

                        markersRef.current.push(marker);
                    });

                    setIsLoading(false);
                })
                .catch(error => {
                    console.error('Error loading map data:', error);
                    setIsLoading(false);
                });

            // Handle window resize for responsive map
            const handleResize = () => {
                if (map.current) {
                    setTimeout(() => {
                        map.current?.invalidateSize();
                    }, 100);
                }
            };

            window.addEventListener('resize', handleResize);
            
            return () => {
                window.removeEventListener('resize', handleResize);
                if (map.current) {
                    map.current.remove();
                    map.current = null;
                }
            };
        }
    }, [onCityClick]);

    return (
        <div className="relative w-full max-w-6xl h-full mx-auto px-4 sm:px-6 lg:px-8">
            {/* Decorative border frame */}
            <div className="absolute inset-0 -m-1 rounded-3xl bg-gradient-to-br from-[#FF9933]/20 via-transparent to-[#138808]/20 pointer-events-none" />
            
            {/* Map container */}
            <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-xl ring-1 ring-black/5">
                <div
                    ref={mapContainer}
                    className="w-full h-full z-10 relative"
                    style={{ backgroundColor: '#f9f2d3ff' }}
                />

                {/* Subtle inner shadow overlay */}
                <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{ boxShadow: 'inset 0 2px 20px rgba(0,0,0,0.05)' }} />
            </div>

            {/* Loading indicator with tricolor theme */}
            {isLoading && (
                <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl" style={{ backgroundColor: 'rgba(239, 208, 50, 0.7)', backdropFilter: 'blur(8px)' }}>
                    <div className="flex flex-col items-center gap-4 p-8 rounded-2xl" style={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)' }}>
                        <div className="relative">
                            <div className="w-14 h-14 border-4 rounded-full" style={{ borderColor: '#E8E8E8' }} />
                            <div className="absolute inset-0 w-14 h-14 border-4 border-transparent rounded-full spinner-tricolor" style={{ borderTopColor: '#FF9933' }} />
                        </div>
                        <p className="font-medium tracking-wide" style={{ color: '#2D1810' }}>Loading map...</p>
                    </div>
                </div>
            )}

            {/* Enhanced Legend */}
            <div 
                className="absolute bottom-6 left-6 rounded-2xl p-5 z-20 text-sm max-w-xs"
                style={{ 
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(254, 247, 228, 0.85))',
                    backdropFilter: 'blur(16px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.4)'
                }}
            >
                <div className="font-semibold mb-4 flex items-center gap-2" style={{ color: '#2D1810' }}>
                    <span 
                        className="w-1 h-5 rounded-full"
                        style={{ background: 'linear-gradient(to bottom, #FF9933, #138808)' }}
                    />
                    City Types
                </div>
                <div className="space-y-4">
                    <div className="flex items-center gap-4 group cursor-pointer">
                        <div 
                            className="w-4 h-4 rounded-full transition-transform group-hover:scale-110"
                            style={{ 
                                background: 'linear-gradient(135deg, #FF9933, #FFB366)',
                                boxShadow: '0 0 12px rgba(255, 153, 51, 0.4)'
                            }}
                        />
                        <div>
                            <p className="font-medium" style={{ color: '#2D1810' }}>City Meetup</p>
                            <p className="text-xs" style={{ color: '#8B7355' }}>Regular community meetups</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 group cursor-pointer">
                        <div 
                            className="w-4 h-4 rounded-full transition-transform group-hover:scale-110"
                            style={{ 
                                background: 'linear-gradient(135deg, #138808, #1FA855)',
                                boxShadow: '0 0 12px rgba(19, 136, 8, 0.4)'
                            }}
                        />
                        <div>
                            <p className="font-medium" style={{ color: '#2D1810' }}>Trip Location</p>
                            <p className="text-xs" style={{ color: '#8B7355' }}>Planned trip destination</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile instruction - enhanced */}
            <div 
                className="absolute top-4 right-4 z-20 rounded-xl px-4 py-3 text-xs max-w-[180px] sm:hidden flex items-center gap-2"
                style={{ 
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                    color: '#2D1810'
                }}
            >
                <span className="text-lg">👆</span>
                <span>Tap on any city to register</span>
            </div>
        </div>
    );
}
