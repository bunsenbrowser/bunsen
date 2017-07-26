import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import {DiscoveryModule} from './discovery/discovery.module';
import {AppRoutingModule} from './app-routing.module';
import {HttpModule} from '@angular/http';
import { BunsenServerService } from './services/bunsen-server.service';
import {HttpClientModule} from '@angular/common/http';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    DiscoveryModule,
    AppRoutingModule,
    // HttpModule,
    HttpClientModule
  ],
  providers: [BunsenServerService],
  bootstrap: [AppComponent]
})
export class AppModule { }
