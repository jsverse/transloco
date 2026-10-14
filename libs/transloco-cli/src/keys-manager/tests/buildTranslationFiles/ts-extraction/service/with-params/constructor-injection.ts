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
    id: DataSegmentation[key],
  }));
  arrayResult: string[];
  arrayResult2: string[];
  /** me no */
  private dispose: any[] = [];

  constructor(
    private cdr: ChangeDetectorRef,
    private formBuilder: FormBuilder,

    public transloco: TranslocoService,
  ) {
    this.transloco.translate('1', { 1: '' });
    const a = 'asdf';
    const b = 'asdf';
    const c = 'asdf';
    transloco
      .selectTranslate('3', { 3: '' })
      .subscribe((t) => (this.arrayResult = t));
    transloco
      .selectTranslate(['2'], { 2: '' })
      .subscribe((t) => (this.arrayResult = t));
  }

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      segmentationBucketsNum: [metadata.segmentationBucketsNum || 0],
      segmentationFields: [metadata.segmentationFields || []],
      dd: translate(dontTake, { id: 'fdfd' }, 'ess'),
      dfjdlfd: this.transloco.translate('4', { 4: 123 }),
    });

    this.form
      .get('segmentationBucketsNum')
      .valueChanges.pipe(untilDestroyed(this))
      .subscribe((res: number) => {
        this.cdr.detectChanges();
        this.transloco = this.transloco.translate(`5`, { 5: {} });
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
          this.transloco.translate('6', { 6: new Date() });
          this.form.patchValue({
            segmentationBucketsNum: this.transloco.translate(`7`, { 7: 12 }),
          });
        } else {
          this.form.patchValue({
            segmentationFields: [this.transloco.translate(`8`, { 8: '' })],
            segmentationBucketsNum: 0,
          });
          this.activeIds = [];
        }

        this.cdr.detectChanges();
      });

    this.dispose.push(
      autorun(() => {}),
      autorun(() => {
        const fields = toJS(this.lightConnectStore.segmentationFields);
        segmentationFields.patchValue(fields);
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

    this.brandDataSourceId = () =>
      this.transloco.translate('9', { 9: 1 }, 'en');
    this.dataSegmentation.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((res: string) => {
        this.lightConnectStore.setDataSegmentation(res);
        this.transloco.translate('10', { 10: 1 }, 'es');
      });

    const dataSegmentation =
      this.lightConnectStore.dataPreview.metadata.dataSegmentation;
    if (!isNil(dataSegmentation)) {
      this.dataSegmentation.patchValue(dataSegmentation);
    }
  }

  ngOnDestroy(): void {
    if (this.dispose) {
      this.dispose.forEach((i) => i());
    }
  }

  get textDisabledColor() {
    return this.form.get('shouldUsePartitions').value
      ? 'primary-400'
      : 'primary-200';
  }

  get shouldDisableAccordion() {
    const shouldUsePartitions =
      this.form && this.form.get('shouldUsePartitions');
    this.cc = this.transloco.translate('11', { 11: 11 });

    return !shouldUsePartitions || !shouldUsePartitions.value;
  }
}
