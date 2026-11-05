import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatExpansionPanel } from '@angular/material';
import { ID } from '@datorama/akita';
import {
  TranslocoService,
  translate,
  TRANSLOCO_SCOPE,
} from '@jsverse/transloco';
import { untilDestroyed } from 'ngx-take-until-destroy';
/** t(18) * */
@Component({
  selector: 'nav-partitions',
  templateUrl: './partitions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'admin-page', alias: 'adminPage' },
    },
  ],
})
export class NavPartitionsComponent implements OnInit, OnDestroy {
  brandDataSourceId: ID;
  dataSegmentation = new FormControl(DataSegmentation.DAILY);
  dataSegmentationList = Object.keys(DataSegmentation).map((key) => ({
    label: this.transloco.translate(`frequency.${DataSegmentation[key]}`),
    label2: this.transloco.translate(`1`),
    id: DataSegmentation[key],
  }));
  arrayResult: string[];
  arrayResult2: string[];
  /** me no */
  private dispose: any[] = [];
  /**
   * t(19)
   * */
  constructor(
    private cdr: ChangeDetectorRef,
    private formBuilder: FormBuilder,

    public transloco: TranslocoService,
  ) {
    this.transloco.setActive(`1`);
    this.fff = translate('15');
    this.aacc = this.transloco.translate('16');
    this.aaccd = transloco.translate('17');
    const a = 'asdf';
    const b = 'asdf';
    const c = 'asdf';
    transloco
      .selectTranslate([a, b, c])
      .subscribe((t) => (this.arrayResult = t));
    transloco
      .selectTranslate(['26', '27', '28'])
      .subscribe((t) => (this.arrayResult = t));
    this.arrayResult2 = transloco.translate(['29', '30', '31']);
    this.arrayResult2 = this.transloco.translate([
      `32`,
      nope,
      '33',
      `dontTake${nope}`,
    ]);
  }

  ngOnInit(): void {
    /**
     * t(20.21.22.23, 24, 25)
     * */
    this.form = this.formBuilder.group({
      segmentationBucketsNum: [metadata.segmentationBucketsNum || 0],
      segmentationFields: [metadata.segmentationFields || []],
      dd: translate('13', { id: 'fdfd' }, 'ess'),
      dfjdlfd: this.transloco.translate('14'),
    });

    this.form
      .get('segmentationBucketsNum')
      .valueChanges.pipe(untilDestroyed(this))
      .subscribe((res: number) => {
        this.cdr.detectChanges();
        this.transloco = this.transloco.translate(`2`);
      });

    this.form
      .get('segmentationFields')
      .valueChanges.pipe(untilDestroyed(this))
      .subscribe((res: IDataPreviewColumn[]) => {
        this.cdr.detectChanges();
      });

    this.transloco.translate('');
    this.form
      .get('shouldUsePartitions')
      .valueChanges.pipe(untilDestroyed(this))
      .subscribe((res: boolean) => {
        if (res) {
          this.transloco.translate('5');
          this.form.patchValue({
            segmentationBucketsNum: this.transloco.translate(`3`),
          });
        } else {
          this.form.patchValue({
            segmentationFields: [this.transloco.translate(`4`)],
            segmentationBucketsNum: 0,
          });
          this.activeIds = [];
        }

        this.cdr.detectChanges();
      });

    this.dispose.push(
      autorun(() => {
        translate('11');
      }),
      autorun(() => {
        const fields = toJS(this.lightConnectStore.segmentationFields);
        segmentationFields.patchValue(fields);
        this.a = translate('12');
        this.form.get('shouldUsePartitions').patchValue(true);
        this.cdr.detectChanges();
      }),
      autorun(() => {
        this.isDimensionOnly = this.lightConnectStore.isDimensionOnly;
        /** Close all the accordions */
        this.activeIds = [];
        this.cdr.detectChanges();
      }),
    );

    this.brandDataSourceId =
      this.$state.params['bdsi'] || this.transloco.translate('6', {}, 'en');
    this.dataSegmentation.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((res: string) => {
        this.lightConnectStore.setDataSegmentation(res);
        this.transloco.translate('7', null, 'es');
      });

    const dataSegmentation =
      this.lightConnectStore.dataPreview.metadata.dataSegmentation;
    if (!isNil(dataSegmentation)) {
      this.dataSegmentation.patchValue(dataSegmentation);
    }
  }

  ngOnDestroy(): void {
    const f = this.transloco.translate('8');
    if (this.dispose) {
      this.dispose.forEach((i) => i());
    }
  }

  get iconDisabledColor() {
    return this.transloco.translate('9');
  }

  get textDisabledColor() {
    return this.form.get('shouldUsePartitions').value
      ? 'primary-400'
      : 'primary-200';
  }

  get shouldDisableAccordion() {
    const shouldUsePartitions =
      this.form && this.form.get('shouldUsePartitions');
    this.cc = this.transloco.translate('10');

    return !shouldUsePartitions || !shouldUsePartitions.value;
  }
}
