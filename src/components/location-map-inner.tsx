"use client";

import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { site } from "@/lib/site";

const position: [number, number] = [site.lat, site.lng];

const icon = L.divIcon({
  className: "",
  html: '<span class="pin-wrap"><span class="pin-head"></span><span class="pin-stick"></span></span>',
  iconSize: [28, 34],
  iconAnchor: [14, 34],
  popupAnchor: [0, -28],
});

function InvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => map.invalidateSize());
    return () => window.cancelAnimationFrame(frame);
  }, [map]);
  return null;
}

export default function LocationMapInner() {
  return (
    <MapContainer
      center={position}
      zoom={16}
      scrollWheelZoom={false}
      className="h-full w-full"
      aria-label="Zemljevid z označeno lokacijo EL-MOTO na Špruhi 33 v Trzinu"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position} icon={icon}>
        <Popup>
          <strong>EL-MOTO</strong>
          <br />
          Špruha 33, 1236 Trzin
        </Popup>
      </Marker>
      <InvalidateSize />
    </MapContainer>
  );
}
