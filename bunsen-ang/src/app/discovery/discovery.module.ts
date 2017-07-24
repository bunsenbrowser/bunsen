import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DiscoveryRoutingModule } from './discovery-routing.module';
import { DiscoveryComponent } from './discovery.component';

@NgModule({
  imports: [
    CommonModule,
    DiscoveryRoutingModule
  ],
  declarations: [DiscoveryComponent]
})
export class DiscoveryModule { }

