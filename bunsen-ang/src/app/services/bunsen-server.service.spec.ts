import { TestBed, inject } from '@angular/core/testing';

import { BunsenServerService } from './bunsen-server.service';

describe('BunsenServerService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BunsenServerService]
    });
  });

  it('should be created', inject([BunsenServerService], (service: BunsenServerService) => {
    expect(service).toBeTruthy();
  }));
});
