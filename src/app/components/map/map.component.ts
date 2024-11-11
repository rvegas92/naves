import { Component, OnInit } from '@angular/core';
import { Loader } from '@googlemaps/js-api-loader';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {
  apiLoaded: Promise<boolean>;
  // Coordenadas de Lima, Perú
  center = { lat: -12.0464, lng: -77.0428 }; 
  // Nivel de zoom para ver todo el continente (puedes ajustarlo según lo que necesites)
  zoom = 2; 

  markers = [
    {
      position: { lat: -12.0464, lng: -77.0428 },
      title: 'Lima',
      icon: {
        url: 'assets/barco.png',
        scaledSize: new google.maps.Size(50, 30),
        anchor: new google.maps.Point(25, 25),
      },
    },
    {
      position: { lat: 48.8566, lng: 2.3522 }, // París
      title: 'París',
      icon: {
        url: 'assets/barco.png',
        scaledSize: new google.maps.Size(50, 30),
        anchor: new google.maps.Point(25, 25),
      },
    },
    {
      position: { lat: 34.0522, lng: -118.2437 }, // Los Ángeles
      title: 'Los Ángeles',
      icon: {
        url: 'assets/barco.png',
        scaledSize: new google.maps.Size(50, 30),
        anchor: new google.maps.Point(25, 25),
      },
    },
    {
      position: { lat: 38.7169, lng: -9.1399 }, // Lisboa, Portugal
      title: 'Lisboa',
      icon: {
        url: 'assets/barco.png',
        scaledSize: new google.maps.Size(50, 30),
        anchor: new google.maps.Point(25, 25),
      },
    },
  ];

  // Opciones para la primera línea: Lima -> Los Ángeles
  polylineOptions1 = {
    path: [
      { lat: -12.0464, lng: -77.0428 }, // Lima
      { lat: 34.0522, lng: -118.2437 }, // Los Ángeles
    ],
    geodesic: true,
    strokeColor: '#00AAE4', // Color verde
    strokeOpacity: 1.0,
    strokeWeight: 2, // Línea más gruesa
  };

  // Opciones para la segunda línea: Lima -> París
  polylineOptions2 = {
    path: [
      { lat: -12.0464, lng: -77.0428 }, // Lima
      { lat: 48.8566, lng: 2.3522 }, // París
    ],
    geodesic: true,
    strokeColor: '#00AAE4', // Color verde
    strokeOpacity: 1.0,
    strokeWeight: 2, // Línea más gruesa
  };

  // Opciones para la tercera línea: Lima -> Lisboa
  polylineOptions3 = {
    path: [
      { lat: -12.0464, lng: -77.0428 }, // Lima
      { lat: 38.7169, lng: -9.1399 }, // Lisboa
    ],
    geodesic: true,
    strokeColor: '#00AAE4', // Color verde
    strokeOpacity: 1.0,
    strokeWeight: 2, // Línea más gruesa
  };

  constructor() {
    // Cargar la API de Google Maps
    this.apiLoaded = new Loader({
      apiKey: 'AIzaSyAd4TLUymnjQSC9fi-ctrcl80iFU51AkDk', // Reemplaza con tu propia clave de API
      version: 'weekly',
    })
      .load()
      .then(() => true)
      .catch(() => false);
  }

  ngOnInit(): void {}
}