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

  fechaDesde: string = '';
  fechaHasta: string = '';

  barcos: any[] = [];
  totalBarcos: number = 0;
  barcosEnTransito: number = 0;
  barcosEntregados: number = 0;

  rutasPorBarco: { [contenedor: string]: { markers: any[], polyline: any } } = {};
  barcosSeleccionados: Set<string> = new Set();

  showModal: boolean = false;
  selectedStat: any = null;
  selectedEstadoFilter: string = 'transito';

  panelFiltrosOpen: boolean = true;
  panelEmbarquesOpen: boolean = true;

  pageSize: number = 20;
  currentPage: number = 1;
  totalPages: number = 1;

  isLoadingRoutes: boolean = false;
  routesProcessed: number = 0;
  totalRoutesToProcess: number = 0;

  dashboardStats = [
    { title: 'Total de Barcos', value: 0, icon: 'ship', color: '#1976d2', key: 'total' },
    { title: 'Peso Bruto (kg)', value: 0, icon: 'weight', color: '#ff9800', key: 'pesobruto' },
    { title: 'Peso Neto (kg)', value: 0, icon: 'weight', color: '#00bcd4', key: 'pesoneto' }
  ];

  ngOnInit(): void {
    this.initDates();
    this.getContainer();
  }

  initDates(): void {
    const hoy = new Date();
    const hace7 = new Date();
    hace7.setDate(hoy.getDate() - 7);
    this.fechaHasta = this.toInputDate(hoy);
    this.fechaDesde = this.toInputDate(hace7);
  }

  toInputDate(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  toApiDate(s: string): string {
    const [y, m, d] = s.split('-');
    return `${y}${m}${d}`;
  }

  onDateChange(): void {
    this.markers = [];
    this.polylines = [];
    this.rutasPorBarco = {};
    this.barcosSeleccionados.clear();
    this.getContainer();
  }

  getContainer() {
    this.mapService.obtenerContenedores({
      fechadesde: this.toApiDate(this.fechaDesde),
      fechahasta: this.toApiDate(this.fechaHasta)
    }).subscribe(
      async (resp) => {
        if (!!resp && resp.length && resp[0].id) {
          this.barcos = resp[0].id;
          this.totalBarcos = this.barcos.length;
          this.updateStats();
          this.generarBarcos(this.barcos);
          this.selectAllBarcos();
        }
      }
    );
  }

  parseEta(eta: string): Date | null {
    if (!eta || eta.length !== 8) return null;
    const y = +eta.slice(0, 4), m = +eta.slice(4, 6) - 1, d = +eta.slice(6, 8);
    return new Date(y, m, d);
  }

  updateStats(): void {
    let pesoNeto = 0, pesoBruto = 0;

    for (const b of this.barcos) {
      pesoNeto += b.pesoneto || 0;
      pesoBruto += b.pesobruto || 0;
    }

    this.dashboardStats[0].value = this.totalBarcos;
    this.dashboardStats[1].value = Math.round(pesoBruto);
    this.dashboardStats[2].value = Math.round(pesoNeto);
  }

  getEstado(b: any): string {
    const estado = b.estado || b.ESTADO;
    if (estado === 'FU') return 'Pendiente';
    if (estado === 'PE') return 'En Transito';
    if (estado === 'FA') return 'Entregado';

    // const eta = this.parseEta(b.ETA);
    // if (!eta) return 'En Transito';
    // const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    // return eta >= hoy ? 'En Transito' : 'Entregado';
    return 'Sin estado';
  }

  getEstadoCounts(): { transito: number, entregado: number } {
    let transito = 0, entregado = 0;
    for (const b of this.barcos) {
      const estado = this.getEstado(b);
      if (estado === 'En Transito' || estado === 'Pendiente') {
        transito++;
      } else if (estado === 'Entregado') {
        entregado++;
      }
    }
    return { transito, entregado };
  }

  openModal(stat: any): void {
    this.selectedStat = stat;
    this.selectedEstadoFilter = 'transito';
    this.currentPage = 1;
    this.calcTotalPages();
    this.showModal = true;
  }

  selectEstadoFilter(estado: string): void {
    this.selectedEstadoFilter = estado;
    this.currentPage = 1;
    this.calcTotalPages();
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedStat = null;
  }

  calcTotalPages(): void {
    const total = this.getBarcosFiltrados().length;
    this.totalPages = Math.ceil(total / this.pageSize) || 1;
  }

  getPaginatedBarcos(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.getBarcosFiltrados().slice(start, start + this.pageSize);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  togglePanel(panel: string): void {
    if (panel === 'filtros') this.panelFiltrosOpen = !this.panelFiltrosOpen;
    if (panel === 'embarques') this.panelEmbarquesOpen = !this.panelEmbarquesOpen;
  }

  getBarcosFiltrados(): any[] {
    if (!this.selectedStat) return [];
    return this.barcos.filter((b: any) => {
      const estado = this.getEstado(b);
      if (this.selectedEstadoFilter === 'transito') {
        return estado === 'En Transito' || estado === 'Pendiente';
      } else if (this.selectedEstadoFilter === 'entregado') {
        return estado === 'Entregado';
      }
      return true;
    });
  }

  isBarcoEntregado(b: any): boolean {
    return this.getEstado(b) === 'Entregado';
  }

  getPageRange(): number[] {
    const range: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    for (let i = start; i <= end; i++) range.push(i);
    return range;
  }

  generarBarcos(barcos: any) {
    this.dibujarBarcos(barcos);
  }

  async dibujarBarcos(barcos: any) {
    const barcosEnRuta = barcos.filter((e: any) => {
      const estado = e.estado || e.ESTADO;
      return e.lineanaviera && e.booking && estado !== 'FA';
    });

    this.totalRoutesToProcess = barcosEnRuta.length;
    this.routesProcessed = 0;
    this.isLoadingRoutes = this.totalRoutesToProcess > 0;

    for (const e of barcosEnRuta) {
      const postcustom = {
        authCode: environment.keyShipGo,
        containerNumber: e.contenedor || '',
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

          const barcoMarkers: any[] = [];
          locations.forEach((location, index) => {
            const marker = {
              position: location,
              label: (index + 1).toString()
            };
            barcoMarkers.push(marker);
          });

          const poli = {
            path: [lima, currentCoordinates, shanghaiCoordinates],
            geodesic: true,
            strokeColor: 'blue',
            strokeOpacity: 0.5,
            strokeWeight: 0.5
          };

          const key = e.contenedor || e.embarquenumero;
          this.rutasPorBarco[key] = { markers: barcoMarkers, polyline: poli };
          this.barcosSeleccionados.add(key);
        }
      }

      this.routesProcessed++;
      this.refreshMap();
    }

    this.isLoadingRoutes = false;
  }

  refreshMap(): void {
    this.markers = [];
    this.polylines = [];
    for (const key of this.barcosSeleccionados) {
      const ruta = this.rutasPorBarco[key];
      if (ruta) {
        this.markers.push(...ruta.markers);
        this.polylines.push(ruta.polyline);
      }
    }
  }

  isSelected(barco: any): boolean {
    const key = barco.contenedor || barco.embarquenumero;
    return this.barcosSeleccionados.has(key);
  }

  toggleBarco(barco: any): void {
    const key = barco.contenedor || barco.embarquenumero;
    if (this.barcosSeleccionados.has(key)) {
      this.barcosSeleccionados.delete(key);
    } else {
      this.barcosSeleccionados.add(key);
    }
    this.refreshMap();
  }

  isAllSelected(): boolean {
    const filtrados = this.getBarcosFiltrados();
    if (!filtrados.length) return false;
    return filtrados.every(b => this.isSelected(b));
  }

  selectAllBarcos(): void {
    for (const b of this.barcos) {
      const key = b.contenedor || b.embarquenumero;
      this.barcosSeleccionados.add(key);
    }
    this.refreshMap();
  }

  toggleSelectAll(): void {
    const filtrados = this.getBarcosFiltrados();
    if (this.isAllSelected()) {
      for (const b of filtrados) {
        const key = b.contenedor || b.embarquenumero;
        this.barcosSeleccionados.delete(key);
      }
    } else {
      for (const b of filtrados) {
        const key = b.contenedor || b.embarquenumero;
        this.barcosSeleccionados.add(key);
      }
    }
    this.refreshMap();
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