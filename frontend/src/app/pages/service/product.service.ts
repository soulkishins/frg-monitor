import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { ProductResponse, ProductRequest } from '../models/product.model';
import { Page } from '../models/global.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly baseUrl = `${environment.api_url}/produto`;

  constructor(private http: HttpClient) { }

  getProducts(filters: {[param: string]: string | number}): Observable<Page<ProductResponse>> {
    return this.http.get<Page<ProductResponse>>(this.baseUrl, { params: filters });
  }

  getProduct(id: string): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(`${this.baseUrl}/${id}`);
  }

  postProduct(product: ProductRequest): Observable<ProductResponse> {
    return this.http.post<ProductResponse>(this.baseUrl, product);
  }  

  putProduct(id: string, product: ProductRequest): Observable<ProductResponse> {
    return this.http.put<ProductResponse>(`${this.baseUrl}/${id}`, product);
  }

  deleteProduct(id: string): Observable<ProductResponse[]> {
    return this.http.delete<ProductResponse[]>(`${this.baseUrl}/${id}`);
  }

}
