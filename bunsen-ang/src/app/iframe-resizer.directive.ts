import {AfterViewInit, Directive, ElementRef, OnDestroy} from '@angular/core';
import {IFrameComponent, iframeResizer} from 'iframe-resizer';

@Directive({
  selector: '[appIFrameResizer]'
})
export class IFrameResizerDirective implements AfterViewInit, OnDestroy {
  component: IFrameComponent;


  constructor(public element: ElementRef) {
  }

  ngAfterViewInit() {
    console.log("IFrameResizerDirective ngAfterViewInit")
    const components = iframeResizer({
      checkOrigin: false,
      heightCalculationMethod: 'documentElementOffset',
      log: true
    }, this.element.nativeElement);

    /* save component reference so we can close it later */
    this.component = components && components.length > 0 ? components[0] : null;
  }

  ngOnDestroy(): void {
    if (this.component && this.component.iFrameResizer) {
      this.component.iFrameResizer.close();
    }
  }

}
