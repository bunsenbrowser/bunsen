import { Injectable } from '@angular/core';
import {Http, RequestOptions} from '@angular/http';
import {Observable} from 'rxjs/Observable';

@Injectable()
export class BunsenServerService {

  constructor(private http:Http) { }

  sendDat(serverUrl, datUrl:string): Observable<string> {
    // Observable<Response> ob = this.http.post(serverUrl, datUrl );
    let headers = new Headers({ 'Content-Type': 'application/json' });
    // let options = new RequestOptions({ headers: headers });
    // return this.http.post(serverUrl, datUrl, options)
    //   .map(this.extractData)
    //   .catch(this.handleErrorObservable);
    return null;

  }


}
