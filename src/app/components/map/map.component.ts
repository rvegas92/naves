import { Component, OnInit, inject } from '@angular/core';
import { Loader } from '@googlemaps/js-api-loader';
import { environment } from 'src/environments/environment';
import { MapService } from 'src/app/services/map.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {

  // center = { lat: 0, lng: -30 };  // Centro del mapa para mostrar ambos puntos
  // zoom = 3;

  // // Definición de los marcadores
  // markers = [
  //   { position: { lat: -12.0464, lng: -77.1187 }, label: '1', title: 'Punto 1' }, // Punto en Perú
  //   { position: { lat: 51.509865, lng: -0.118092 }, label: '2', title: 'Punto 2' }  // Punto en Reino Unido
  // ];

  // // Definición de la ruta
  // path = [
  //   { lat: -12.0464, lng: -77.1187 },  // Punto de inicio en Perú
  //   { lat: 8.538, lng: -79.882 },      // Paso intermedio en Panamá
  //   { lat: 51.509865, lng: -0.118092 } // Punto de destino en Reino Unido
  // ];

  // // Opciones de la polilínea
  // polylineOptions = {
  //   strokeColor: '#0000FF',
  //   strokeOpacity: 0.7,
  //   strokeWeight: 3,
  //   icons: [
  //     {
  //       icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 4 },
  //       offset: '0',
  //       repeat: '20px'  // Hace que la línea sea discontinua
  //     }
  //   ],
  //   geodesic: true,  // Activa la curva geodésica
  // };

  private mapService = inject( MapService );

  constructor() {
    this.apiLoaded = new Loader({
      apiKey: environment.googleMapsApiKey,
      version: 'weekly',
    }).load().then(() => true).catch(() => false);
  }

  apiLoaded: Promise<boolean>;
  center = { lat: -12.0464, lng: -77.1187 }; 
  zoom = 1.5; 

  markers: any = []
  polylines: any = []

  ngOnInit(): void {
    this.getContainer()
  }

  getContainer() {
    this.mapService.obtenerContenedores({ fechadesde: '20241101', fechahasta: '20243112' }).subscribe(
      async (resp)=> {
        if(!!resp && resp.length) {
          this.generarBarcos(resp[0].id)
        }
      }
    );
  }

  generarBarcos(barcos: any) {
    this.dibujarBarcos(barcos);
  }

  async dibujarBarcos(barcos: any) {
    for (const e of barcos) {
      const postcustom = {
        authCode: environment.keyShipGo,
        containerNumber: e.contenedor,
        shippingLine: e.lineanaviera,
        blContainersRef: e.booking
      };
  
      const id = await this.mapService.obtenerRequestId(postcustom);
  
      if (!!id) {
        const resp = await this.mapService.obtenerDataContainer({ authCode: environment.keyShipGo, requestId: id, mappoint: true });
  
        if (!!resp && resp.length > 0 && resp[0]?.VesselLatitude && resp[0]?.VesselLongitude) {
          const geocoder = new google.maps.Geocoder();
          const shanghaiCoordinates = await this.geocodeAddress(geocoder, resp[0]?.Pod);
          const lima = { lat: -12.0464, lng: -77.1187 };
          const currentCoordinates = { lat: resp[0]?.VesselLatitude, lng: resp[0]?.VesselLongitude };

          const locations = [
            lima,
            currentCoordinates,
            shanghaiCoordinates
          ];
  
          locations.forEach((location, index) => {
            const marker = {
              position: location,
              label: (index + 1).toString()
            };
            this.markers.push(marker);
          });
 
          const poli = {
            path: [lima, currentCoordinates, shanghaiCoordinates],
            geodesic: true,
            strokeColor: 'blue',
            strokeOpacity: 0.5,
            strokeWeight: 0.5
          };
          this.polylines.push(poli);
        }
      }
    }
  }

  geocodeAddress(geocoder: any, address: string) {
    return new Promise<{ lat: number, lng: number }>((resolve, reject) => {
      geocoder.geocode({ address: address }, (results: any, status: any) => {
        if (status === "OK") {
          const location = results[0].geometry.location;
          resolve({
            lat: location.lat(),
            lng: location.lng()
          });
        } else {
          reject("Geocoding falló por: " + status);
        }
      });
    });
  }

}