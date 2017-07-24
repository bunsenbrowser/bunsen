import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Bunsen';
  value = '';
  update(value: string) {
    this.value = value;
    console.log("dat uri: " + this.value)
  }
}
