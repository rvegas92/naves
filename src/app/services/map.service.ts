import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class MapService {

  private readonly baseUrl: string = environment.baseUrl;

  constructor(private http: HttpClient) {}

  obtenerContenedores(params: any): Observable<any> {
    const url = `${this.baseUrl}/reporte/contenedores/${params.fechadesde}/${params.fechahasta}`;
    try {
      return this.http.get<any>(url);
    } catch (error: any) {
      throw new Error(error.error?.message || 'Error al obtener contenedores');
    }
  }

  async obtenerRequestId(params: any, useFormUrlEncoded: boolean = true): Promise<any> {
    const url = `https://shipsgo.com/api/v1.2/ContainerService/PostCustomContainerFormWithBl`;
  
    let body: any;
    let headers = new HttpHeaders();
  
    if (useFormUrlEncoded) {
      headers = headers.set('Content-Type', 'application/x-www-form-urlencoded');
      body = this.toFormUrlEncoded(params);
    } else {
      headers = headers.set('Content-Type', 'application/json');
      body = params;
    }
  
    try {
      const response = await this.http.post<any>(url, body, { headers }).toPromise();
      return response;
    } catch (error: any) {
      return null;
    }
  }

  private toFormUrlEncoded(params: any): string {
    return Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');
  }

  async obtenerDataContainer(params: any): Promise<any> {
    const url = `https://shipsgo.com/api/ContainerService/GetContainerInfo`;

    let httpParams = new HttpParams();
    for (const key in params) {
      if (params.hasOwnProperty(key)) {
        httpParams = httpParams.set(key, params[key]);
      }
    }

    try {
      const response = await this.http.get<any>(url, { params: httpParams }).toPromise();
      return response;
    } catch (error: any) {
      return null;
    } 
  }

}
