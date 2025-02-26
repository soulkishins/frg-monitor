import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { SubCategoryResponse, SubCategoryRequest } from '../../layout/models/sub-category.model';

@Injectable({
  providedIn: 'root'
})
export class SubCategoryService {
  private readonly baseUrl = `${environment.api_url}/categoria`;

  constructor(private http: HttpClient) { }

  getSubCategories(categoryId: string): Observable<SubCategoryResponse[]> {
    const url = `${this.baseUrl}/${categoryId}/sub-categoria`;
    return this.http.get<SubCategoryResponse[]>(url);
  }

  getSubCategory(categoryId: string, subCategoryId: string): Observable<SubCategoryResponse> {
    const url = `${this.baseUrl}/${categoryId}/sub-categoria/${subCategoryId}`;
    return this.http.get<SubCategoryResponse>(url);
  }

  postSubCategory(categoryId: string, subCategory: SubCategoryRequest): Observable<SubCategoryResponse> {
    const url = `${this.baseUrl}/${categoryId}/sub-categoria`;
    return this.http.post<SubCategoryResponse>(url, subCategory);
  }  

  putSubCategory(categoryId: string, subCategoryId: string, subCategory: SubCategoryRequest): Observable<SubCategoryResponse> {
    const url = `${this.baseUrl}/${categoryId}/sub-categoria/${subCategoryId}`;
    return this.http.put<SubCategoryResponse>(url, subCategory);
  }

  deleteSubCategory(categoryId: string, subCategoryId: string): Observable<SubCategoryResponse[]> {
    const url = `${this.baseUrl}/${categoryId}/sub-categoria/${subCategoryId}`;
    return this.http.delete<SubCategoryResponse[]>(url);
  }

}
