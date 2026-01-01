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

export default function TriColorMap({ onCityClick }: TriColorMapProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<L.Map | null>(null);
    const markersRef = useRef<L.Marker[]>([]);
    const geoJsonLayersRef = useRef<L.GeoJSON[]>([]);
    const gridDotsRef = useRef<L.CircleMarker[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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
                            opacity: 0.6
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
            <div className="absolute inset-0 -m-1 rounded-3xl bg-gradient-to-br from-primary/20 via-transparent to-accent/20 pointer-events-none" />
            
            {/* Map container */}
            <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-[var(--shadow-elevated)] ring-1 ring-border/50">
                <div
                    ref={mapContainer}
                    className="w-full h-full z-10 relative bg-background"
                />

                {/* Subtle inner shadow overlay */}
                <div className="absolute inset-0 pointer-events-none rounded-2xl shadow-[inset_0_2px_20px_rgba(0,0,0,0.05)]" />
            </div>

            {/* Loading indicator with tricolor theme */}
            {isLoading && (
                <div className="absolute inset-0 z-20 bg-background/70 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                    <div className="flex flex-col items-center gap-4 p-8 glass-card rounded-2xl">
                        <div className="relative">
                            <div className="w-14 h-14 border-4 border-secondary rounded-full" />
                            <div className="absolute inset-0 w-14 h-14 border-4 border-transparent border-t-primary rounded-full spinner-tricolor" />
                        </div>
                        <p className="text-foreground font-medium tracking-wide">Loading map...</p>
                    </div>
                </div>
            )}

            {/* Enhanced Legend */}
            <div className="absolute bottom-6 left-6 glass-legend rounded-2xl p-5 z-20 text-sm max-w-xs">
                <div className="font-semibold mb-4 text-foreground flex items-center gap-2">
                    <span className="w-1 h-5 rounded-full bg-gradient-to-b from-primary to-accent" />
                    City Types
                </div>
                <div className="space-y-4">
                    <div className="flex items-center gap-4 group">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-primary to-[hsl(30,100%,65%)] glow-saffron transition-transform group-hover:scale-110" />
                        <div>
                            <p className="text-foreground font-medium">City Meetup</p>
                            <p className="text-muted-foreground text-xs">Regular community meetups</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 group">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-accent to-[hsl(145,70%,35%)] glow-green transition-transform group-hover:scale-110" />
                        <div>
                            <p className="text-foreground font-medium">Trip Location</p>
                            <p className="text-muted-foreground text-xs">Planned trip destination</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile instruction - enhanced */}
            <div className="absolute top-4 right-4 z-20 glass-card rounded-xl px-4 py-3 text-xs text-foreground max-w-[180px] sm:hidden flex items-center gap-2">
                <span className="text-lg">👆</span>
                <span>Tap on any city to register</span>
            </div>
        </div>
    );
}
