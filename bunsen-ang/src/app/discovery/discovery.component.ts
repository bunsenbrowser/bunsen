import { Component, OnInit } from '@angular/core';
// import * as path from 'path';
// import * as hyperdrive from 'hyperdrive';
// import * as ram from 'random-access-memory';
// import * as swarm from 'hyperdiscovery';

@Component({
  selector: 'app-discovery',
  templateUrl: './discovery.component.html',
  styleUrls: ['./discovery.component.css']
})
export class DiscoveryComponent implements OnInit {

  constructor() { }

  ngOnInit() {
    console.log('hitme');
    // const dest = 'dat://191b04be45638d8f83f0525754bab689875c7689a0616e0192e86d45647f4b54'
    // const archive = hyperdrive(ram, dest);
    // archive.ready(function (err) {
    //   if (err) {
    //     throw err
    //   }
    //   console.log('key', archive.key.toString('hex'))
    //   const sw = swarm(archive)
    //   sw.on('connection', function (peer, type) {
    //     console.log('got', peer, type); // type is 'webrtc-swarm' or 'discovery-swarm'
    //     console.log('connected to', sw.connections, 'peers')
    //     peer.on('close', function () {
    //       console.log('peer disconnected');
    //     });
    //   });
    // });
  }

}
