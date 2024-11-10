import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {

  center: google.maps.LatLngLiteral = { lat: -12.0464, lng: -77.0428 }; // Centro en Lima, Perú
  zoom = 5; // Ajusta el zoom para que abarque Perú y los alrededores

  barcos = [
    { lat: -13.1631, lng: -72.5450, name: 'Barco 1' },
    { lat: 10.6700, lng: -61.5144, name: 'Barco 2' },
    { lat: -34.6037, lng: -58.3816, name: 'Barco 3' },
  ];

  googleMap: google.maps.Map | undefined;

  constructor() { }

  ngOnInit(): void {
    // Inicializa el mapa centrado en Perú
    this.initMap();
    this.mostrarBarcos();
  }

  initMap() {
    this.googleMap = new google.maps.Map(document.getElementById('map') as HTMLElement, {
      center: this.center,
      zoom: this.zoom,
    });
  }

  mostrarBarcos() {
    this.barcos.forEach(barco => {
      const marker = new google.maps.Marker({
        position: { lat: barco.lat, lng: barco.lng },
        title: barco.name,
        map: this.googleMap, // Usa el mapa inicializado
        icon: {
          url: 'https://png.pngtree.com/png-vector/20190429/ourmid/pngtree-vector-boat-icon-png-image_997942.jpg',
          scaledSize: new google.maps.Size(30, 30)
        }
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `<h3>${barco.name}</h3><p>Ubicación: ${barco.lat}, ${barco.lng}</p>`
      });

      marker.addListener('click', () => {
        infoWindow.open(this.googleMap, marker);
      });
    });
  }
}
