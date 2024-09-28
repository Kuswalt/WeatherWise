import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {  

  API_URL = "http://localhost/weatherwise/server/api"

  constructor(private http: HttpClient) { }

  searchByCity(inputdata: any): Observable<any> {
    if (typeof inputdata === 'string') {
      inputdata = inputdata.replace(/\s+/g, '+');
    }
    return this.http.post(`${this.API_URL}/search-city`, inputdata, {
      observe: 'response',
      responseType: 'text'
    }).pipe(
      map(response => {
        if (response.body === null || response.body === '') {
          throw new Error('Empty response body');
        }
        try {
          return JSON.parse(response.body);
        } catch (error) {
          console.error('Error parsing JSON:', response.body);
          throw new Error('Invalid JSON response');
        }
      }),
      catchError(this.handleError)
    );
  }
  
  searchByLocation(inputdata: any): Observable<any> {
    return this.http.post(`${this.API_URL}/search-location`, inputdata, {
      observe: 'response',
      responseType: 'text'
    }).pipe(
      map(response => {
        if (response.body === null || response.body === '') {
          throw new Error('Empty response body');
        }
        try {
          return JSON.parse(response.body);
        } catch (error) {
          console.error('Error parsing JSON:', response.body);
          throw new Error('Invalid JSON response');
        }
      }),
      catchError(this.handleError)
    );
  }

  getFiveDayForecast(inputdata: any): Observable<any> {
    return this.http.post(`${this.API_URL}/get-five-day-forecast`, inputdata, {
        observe: 'response',
        responseType: 'text'
    }).pipe(
        map(response => {
            if (response.body === null || response.body === '') {
                throw new Error('Empty response body');
            }
            try {
                return JSON.parse(response.body);
            } catch (error) {
                console.error('Error parsing JSON:', response.body);
                throw new Error('Invalid JSON response');
            }
        }),
        catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  geocodeByCity(inputdata: any) {
    if (typeof inputdata === 'string') {
      inputdata = inputdata.replace(/\s+/g, '+');
    }
    return this.http.post(`${this.API_URL}/geocode-city`, inputdata);
  }

  reverseGeocodeByLocation(inputdata: any) {
    return this.http.post(`${this.API_URL}/reverse-geocode-location`, inputdata);
  }

  getThreeHourForecast(inputdata: any): Observable<any> {
    return this.http.post(`${this.API_URL}/get-three-hour-forecast`, inputdata, {
        observe: 'response',
        responseType: 'text'
    }).pipe(
        map(response => {
            if (response.body === null || response.body === '') {
                throw new Error('Empty response body');
            }
            try {
                return JSON.parse(response.body);
            } catch (error) {
                console.error('Error parsing JSON:', response.body);
                throw new Error('Invalid JSON response');
            }
        }),
        catchError(this.handleError)
    );
  }
}