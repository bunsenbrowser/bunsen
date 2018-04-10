import { Injectable } from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpResponse} from '@angular/common/http';
import {catchError} from "rxjs/operators";
import {ErrorObservable} from "rxjs/observable/ErrorObservable";
import {Observable} from "rxjs/Observable";

@Injectable()
export class AppService {

  constructor(private http: HttpClient) { }

  getDat(url) {
    return this.http.get(url)
      .pipe(
        catchError(this.handleError)
      );
  }

  getDatResponse(url): Observable<HttpResponse<any>> {
    return this.http.get(url, { observe: 'response', responseType: 'text' })
      .pipe(
        catchError(this.displayDatError)
      );
  }

  private displayDatError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`);

      if (error.status == 404) {
        console.log("gurl, you best get you sum dat!");
        (document.querySelector('#urlBar') as HTMLElement).style.display = "block";
        (document.querySelector('mat-progress-bar') as HTMLElement).style.display = "none";
        // this.fetchedHtml = this.noDat;
        // this.dialog.closeAll();
        let progressMessage = document.querySelector('#progressMessage');
        progressMessage.innerHTML = "";
        // return this.noDat;
      }
    }
    // return an ErrorObservable with a user-facing error message
    return new ErrorObservable(
      'Something bad happened; please try again later.');
  };

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`);
    }
    // return an ErrorObservable with a user-facing error message
    return new ErrorObservable(
      'Something bad happened; please try again later.');
  };

}
