import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import {AppComponent} from './app.component';
import {DiscoveryModule} from './discovery/discovery.module';
import {AppRoutingModule} from './app-routing.module';
import { BunsenServerService } from './services/bunsen-server.service';
import {HttpClientModule} from '@angular/common/http';
import {
  MdButtonModule,
  MdButtonToggleModule,
  MdDialogModule,
  MdIconModule,
  MdMenuModule, MdProgressSpinnerModule,
  MdToolbarModule,
  MdTooltipModule
} from '@angular/material';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { DialogComponent } from './dialog/dialog.component';

@NgModule({
  declarations: [
    AppComponent, DialogComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    DiscoveryModule,
    AppRoutingModule,
    // // HttpModule,
    HttpClientModule,
    MdButtonModule,
    MdButtonToggleModule,
    MdIconModule,
    MdMenuModule,
    MdToolbarModule,
    MdTooltipModule,
    MdProgressSpinnerModule,
    MdDialogModule
  ],
  providers: [BunsenServerService],
  bootstrap: [AppComponent, DialogComponent]
})
export class AppModule { }
