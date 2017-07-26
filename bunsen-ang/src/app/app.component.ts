import { Component } from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Bunsen';
  datUri = '';
  results: string[];
  serverUrl = 'http://localhost:8080'
  // Inject HttpClient into your component or service.
  constructor(private http: HttpClient) {}
  update(datUri: string) {
    this.datUri = datUri;
    console.log("dat datUri: " + this.datUri)
    const body = {uri: this.datUri}
    // Make the HTTP request:
    this.http.post(this.serverUrl,body ).subscribe(data => {
      // Read the result field from the JSON response.
      // this.results = data['results'];
      // console.log("results: " + this.results)
      console.log("data: " + data)
    });
  }
}
