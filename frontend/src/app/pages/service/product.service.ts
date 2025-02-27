import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { ProductResponse, ProductRequest } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly baseUrl = `${environment.api_url}/cliente/{client}/marca/{brand}/produto`;

  constructor(private http: HttpClient) { }

  getProducts(clientId: string, brandId: string): Observable<ProductResponse[]> {
    const url = this.baseUrl.replace('{client}', clientId).replace('{brand}', brandId);
    return this.http.get<ProductResponse[]>(url);
  }

  getProduct(clientId: string, brandId: string, id: string): Observable<ProductResponse> {
    const url = this.baseUrl.replace('{client}', clientId).replace('{brand}', brandId);
    return this.http.get<ProductResponse>(`${url}/${id}`);
  }

  postProduct(clientId: string, brandId: string, product: ProductRequest): Observable<ProductResponse> {
    const url = this.baseUrl.replace('{client}', clientId).replace('{brand}', brandId);
    return this.http.post<ProductResponse>(url, product);
  }  

  putProduct(clientId: string, brandId: string, id: string, product: ProductRequest): Observable<ProductResponse> {
    const url = this.baseUrl.replace('{client}', clientId).replace('{brand}', brandId);
    return this.http.put<ProductResponse>(`${url}/${id}`, product);
  }

  deleteProduct(clientId: string, brandId: string, id: string): Observable<ProductResponse[]> {
    const url = this.baseUrl.replace('{client}', clientId).replace('{brand}', brandId);
    return this.http.delete<ProductResponse[]>(`${url}/${id}`);
  }

}
