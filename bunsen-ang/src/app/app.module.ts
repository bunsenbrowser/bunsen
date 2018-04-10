import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import {AppComponent} from './app.component';
import {AppRoutingModule} from './app-routing.module';
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
// import { DialogComponent } from './dialog/dialog.component';
// import {LoadingComponent} from './dialog/loading.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
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
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
