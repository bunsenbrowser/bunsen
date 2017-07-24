import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {DiscoveryComponent} from './discovery.component';

const routes: Routes = [
  { path: 'discovery', component: DiscoveryComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DiscoveryRoutingModule { }
