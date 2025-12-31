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

// Tri-color animation keyframes as a style
const styles = `
    @keyframes triColorPulse {
        0% { fill: #FF671F; }
        33% { fill: #FFE878; }
        66% { fill: #046A38; }
        100% { fill: #FF671F; }
    }
    
    .tri-color-dot {
        animation: triColorPulse 3s ease-in-out infinite;
        transition: fill 0.3s ease;
    }
`;

export default function TriColorMap({ onCityClick }: TriColorMapProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<L.Map | null>(null);
    const markersRef = useRef<L.Marker[]>([]);
    const geoJsonLayersRef = useRef<L.GeoJSON[]>([]);
    const gridDotsRef = useRef<L.CircleMarker[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Add styles to document
        if (!document.querySelector('style[data-tri-color]')) {
            const styleEl = document.createElement('style');
            styleEl.setAttribute('data-tri-color', 'true');
            styleEl.textContent = styles;
            document.head.appendChild(styleEl);
        }

        // Initialize map
        if (!map.current && mapContainer.current) {
            map.current = L.map(mapContainer.current, {
                zoomControl: true,
                attributionControl: false,
                scrollWheelZoom: true,
                dragging: true,
                touchZoom: true,
                tap: true,
                minZoom: 4,
                maxZoom: 10,
                worldCopyJump: false
            }).setView([23.5937, 78.9629], 5);

            // Set background to light cream color matching other pages
            if (mapContainer.current) {
                mapContainer.current.style.backgroundColor = '#FEFAE7';
            }

            // Load India GeoJSON
            const loadIndiaGeoJSON = fetch('https://raw.githubusercontent.com/datameet/maps/master/Country/india-soi.geojson')
                .then(res => res.json())
                .then(data => {
                    const indiaLayer = L.geoJSON(data, {
                        style: {
                            fillColor: '#F0F0F0',
                            fillOpacity: 1,
                            color: '#1F2937',
                            weight: 1.5,
                            opacity: 1
                        }
                    }).addTo(map.current!);

                    geoJsonLayersRef.current.push(indiaLayer);

                    if (map.current) {
                        const bounds = indiaLayer.getBounds();
                        map.current.fitBounds(bounds, { padding: [50, 50] });
                        
                        // Grid removed as per requirements
                    }
                });

            // Load state borders
            const loadStateBorders = fetch('https://raw.githubusercontent.com/datameet/maps/master/website/docs/data/geojson/states.geojson')
                .then(res => res.json())
                .then(data => {
                    const statesLayer = L.geoJSON(data, {
                        style: {
                            fillColor: 'transparent',
                            color: '#D1D5DB',
                            weight: 1,
                            opacity: 0.7
                        }
                    }).addTo(map.current!);

                    geoJsonLayersRef.current.push(statesLayer);
                });

            // Function to create animated dot grid
            const createAnimatedDotGrid = (bounds: L.LatLngBounds) => {
                const gridCellSize = 2; // Grid spacing in degrees
                const dotRadius = 3; // Radius of the dots
                
                const north = bounds.getNorth() + 0.5;
                const south = bounds.getSouth() - 0.5;
                const east = bounds.getEast() + 0.5;
                const west = bounds.getWest() - 0.5;

                // Create dots at grid intersections
                let colorIndex = 0;
                const colors = ['#FF671F', '#FFE878', '#046A38'];

                for (let lat = Math.floor(south); lat <= Math.ceil(north); lat += gridCellSize) {
                    for (let lng = Math.floor(west); lng <= Math.ceil(east); lng += gridCellSize) {
                        const dot = L.circleMarker([lat, lng], {
                            radius: dotRadius,
                            fillColor: colors[colorIndex % colors.length],
                            color: 'rgba(0,0,0,0)',
                            weight: 0,
                            opacity: 0,
                            fillOpacity: 0.8,
                            className: 'tri-color-dot'
                        }).addTo(map.current!);

                        // Add individual animation with offset
                        const svgElement = dot.getElement() as SVGElement;
                        if (svgElement) {
                            const delay = (colorIndex * 0.1) % 3;
                            svgElement.style.animationDelay = `${delay}s`;
                        }

                        gridDotsRef.current.push(dot);
                        colorIndex++;
                    }
                }
            };

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
                // Cleanup map on unmount
                if (map.current) {
                    map.current.remove();
                    map.current = null;
                }
            };
        }
    }, [onCityClick]);

    return (
        <div className="relative w-[80%] h-full mx-auto">
            {/* Map container - 80% width */}
            <div
                ref={mapContainer}
                className="w-full h-full z-10 relative"
                style={{ background: '#FEFAE7' }}
            />

            {/* Loading indicator */}
            {isLoading && (
                <div className="absolute inset-0 z-20 bg-white bg-opacity-50 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                        <p className="text-gray-700 font-medium">Loading map...</p>
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="absolute bottom-6 left-6 bg-white rounded-lg shadow-lg p-4 z-20 text-sm max-w-xs">
                <div className="font-semibold mb-3 text-gray-800">City Types</div>
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: '#ff671f' }}></div>
                    <div>
                        <p className="text-gray-700 font-medium">City Meetup</p>
                        <p className="text-gray-500 text-xs">Regular community meetups</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: '#046a38' }}></div>
                    <div>
                        <p className="text-gray-700 font-medium">Trip Location</p>
                        <p className="text-gray-500 text-xs">Planned trip destination</p>
                    </div>
                </div>
            </div>

            {/* Mobile instruction */}
            <div className="absolute top-4 right-4 z-20 bg-white bg-opacity-90 rounded-lg shadow-md p-3 text-xs text-gray-700 max-w-xs sm:hidden">
                👆 Tap on any city to register
            </div>
        </div>
    );
}

