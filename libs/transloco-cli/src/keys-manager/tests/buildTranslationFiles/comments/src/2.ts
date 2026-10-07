/**
 * some commment
 */
// @jsverse/transloco
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  HostBinding,
  Input,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type ExtendedGridOptions = {
  onRowDataUpdated: (event) => void;
};

const valueAccessor = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => GridComponent),
  multi: true,
};

@Component({})
export class GridComponent
  extends BaseCustomControl
  implements ControlValueAccessor
{
  @Output() rowDataChanged = new EventEmitter();

  private hasInfinitePagination = false;

  /** t(200)   */
  api: DatoGridAPI<any>;
  gridColumnApi: ColumnApi;
  gridOptions;

  /**
   * t(admin.1, admin.2.3, admin.4, admin.5555)
   */
  @Input() enableSorting = true;
  @Input() enableFilter = true;
  @Input() enableColResize = true;

  @Input()
  set options(options) {
    options.columnDefs = translateColumns(options.columnDefs);
    this.disableColumnMenu(options.columnDefs);
  }

  /**
   * t(201, 202, 203.204)
   *
   *
   * t(205)
   */
  get options() {
    return this.gridOptions;
  }

  constructor(
    private element: ElementRef,
    private cdr: ChangeDetectorRef,
  ) {
    super();

    this.gridOptions = { ...this.defaultGridOptions };
  }

  /**
   * On grid ready
   * @param {GridReadyEvent} event
   *
   * t(
   *  206,
   *  207.208
   * )
   */
  onGridReady(event: GridReadyEvent) {}

  /**
   * call ag-grid's size all columns to fit to container
   * t(209)
   */
  fitToContainer(): void {
    this.gridOptions.api.sizeColumnsToFit();
  }

  /**
   * call ag-grid's size all columns to fit to content
   */
  fitToContent(): void {
    this.gridOptions.columnApi.autoSizeAllColumns();
    if (width > bodyWidth) {
      this.fitToContainer();
    }
  }

  /**
   * Updaet the columns definitions
   * @param {(ColDef | ColGroupDef)[]} columnDefs
   */
  updateColumns(columnDefs: (ColDef | ColGroupDef)[]) {
    this.gridHelper.updateColumns(this.api.gridApi, columnDefs);
  }

  writeValue(obj: any): void {
    const rows = obj ? coerceArray(obj) : [];

    if (this.api.ready) {
      this.api.setSelectedRows(rows);
    } else {
      /**
       * t(210, 211) t(212, 213.214)
       */
    }
  }

  /**
   * disable the column menu and leave only the filter
   */
  private disableColumnMenu(columnDefs: ColDef[]): void {
    columnDefs.forEach((def: ColDef) => {
      def.menuTabs = ['filterMenuTab'];
    });
  }

  /**
   *
   * t(
   *   215,
   *   216,
   *   217.218
   * )
   *
   *
   */
}
