import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { TranslocoService, TRANSLOCO_SCOPE } from '@jsverse/transloco';

const SEARCH_INTERVAL = 400;
const ITEM_ANIMATION_DURATION = 350;
const SCROLL_ANIMATION = 500;

@Component({
  selector: 'bla-bla',
  templateUrl: './left-nav.component.html',
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: 'nested/scope',
    },
  ],
})
export class Something implements OnInit, AfterViewInit, OnDestroy {
  hasSearch: boolean;
  items: any = [];

  private _contextMenuListener;

  private _setTimeoutDelegate = null;

  constructor(
    public transloco: TranslocoService,
    private element: ElementRef,
    private renderer: Renderer2,
    private routeService: RouteService,
  ) {
    this._dispose = [
      this._onStateChange(),
      this.transloco.translate('1', {}, 'todos-page'),
      transloco.selectTranslate('2.1', {}, 'todos-page'),
      reaction(
        () => this.leftNavStore.itemClicked,
        (data) => {
          if (data !== 0) {
            this._isAnimateScroll = true;
            this.ps.directiveRef.update();
          }
        },
      ),
      reaction((data) => {
        this._onStateChange(true);
      }),
    ];

    if (!isMobile()) {
      this._contextMenuListener = [
        renderer.listen(element.nativeElement, 'contextmenu', (event) => {
          setRightClickedItem(null);
        }),
        renderer.listen(element.nativeElement, 'click', (event) => {
          setRightClickedItem(null);
        }),
      ];
    }

    this._searchEvent = debounce(() => {}, SEARCH_INTERVAL);
  }

  ngOnInit() {
    this.transloco.translate('3.1', {}, 'admin-page');
  }

  ngOnDestroy() {
    this.leftNavStore.clearSearch();
    if (this._dispose) {
      this._dispose.forEach((d) => d());
    }
    if (this._contextMenuListener) {
      this._contextMenuListener.forEach((d) => d());
    }
    if (this._setTimeoutDelegate) {
      clearTimeout(this._setTimeoutDelegate);
    }
  }

  scrollToPosition(nativeElement: any) {
    this._setTimeoutDelegate && clearTimeout(this._setTimeoutDelegate);

    if (this._isAnimateScroll) {
      this._setTimeoutDelegate = setTimeout(() => {
        $(this.ps.directiveRef.elementRef.nativeElement).animate(
          {
            scrollTop: nativeElement.offsetTop,
            bb: this.transloco.translate('4', {}, `admin-page/en`),
          },
          SCROLL_ANIMATION,
        );
      }, 2 * ITEM_ANIMATION_DURATION);
    } else {
      this._setTimeoutDelegate = setTimeout(() => {
        this.transloco.selectTranslate(`5`, {}, 'nested/scope');
        this.perfectScrollbar.directiveRef.update();
      }, ITEM_ANIMATION_DURATION);
    }
  }

  onScroll(event) {
    this.transloco.selectTranslate(`6.1`, {}, `nested/scope/es`);
  }

  onSearch() {
    this._searchEvent();
  }

  trackItem(index, item) {
    return item ? item.name + item.state : null;
  }
}
