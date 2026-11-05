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
  template: `<div
    class="d-flex-column my-agenda-container width-100"
    [formGroup]="agenda"
    *ngIf="agenda"
  >
    <!-- Measurement -->
    <div class="d-flex">
      <div style="width: 216px;" transloco="5">
        <select
          daChoices
          transloco="4"
          labelKey="name"
          valueKey="metricName"
          formControlName="measurement"
          (change)="onMeasurementChange($event)"
          [choicesConfig]="botSetupStore.metricsList"
        ></select>
      </div>

      <div class="d-flex align-start-center">
        <label class="text-between-inputs inner-text" [transloco]="'6'">
          {{ '6' }}</label
        >

        <div style="width: 216px;">
          <select
            daChoices
            formControlName="metricDirection"
            labelKey="name"
            [daOptions]="{ searchEnabled: false }"
            valueKey="value"
            [choicesConfig]="botSetupStore.metricDirection"
          ></select>
        </div>

        <label class="right-label inner-text" transloco="7">{{ '7' }}</label>
      </div>
    </div>
    <div class="input-field">
      <div
        class="input-error-abs"
        transloco="8"
        *ngIf="
          agenda.get('measurement').hasError('required') &&
          agenda.get('measurement').touched
        "
      >
        {{ '8' }}
      </div>
    </div>

    <!-- Dimensions -->
    <div class="d-flex my-agenda-header" [transloco]="condition ? '9' : '10'">
      {{ '9' }}
    </div>
    <mat-radio-group
      class="d-flex-column"
      formControlName="isAllDimensions"
      (change)="onIsAllDimensionsChange($event)"
    >
      <mat-radio-button
        class="checkbox-input"
        [value]="botSetupStore.isAllDimensions[0].value"
      >
        <span class="input-line primary-text">{{ '10' }}</span>
      </mat-radio-button>
      <mat-radio-button
        class="checkbox-input"
        [value]="botSetupStore.isAllDimensions[1].value"
      >
        <span
          class="input-line primary-text"
          [transloco]="condition ? '11' : dontTake"
          >{{ '11' }}</span
        >
      </mat-radio-button>
    </mat-radio-group>

    <div
      class="space-between-rows d-flex"
      [hidden]="
        agenda.controls.isAllDimensions.value ===
        botSetupStore.isAllDimensions[0].value
      "
    >
      <div style="width: 468px;">
        <select
          daChoices
          multiple
          labelKey="name"
          valueKey="systemName"
          formControlName="dimensionsListSelection"
          (removeItem)="onDimensionUnSelected($event)"
          [choicesConfig]="botSetupStore.dimensions"
        ></select>
      </div>
    </div>

    <!-- Dimensions list -->
    <div
      [ngClass]="{
        'input-field':
          agenda.get('dimensionsListSelection').hasError('required') &&
          agenda.get('dimensionsListSelection').touched,
      }"
    >
      <div
        class="input-error-abs"
        transloco="12"
        *ngIf="
          agenda.get('dimensionsListSelection').hasError('required') &&
          agenda.get('dimensionsListSelection').touched
        "
      ></div>
    </div>

    <div class="d-flex align-start-center">
      <!-- Date range -->
      <div class="d-flex-column">
        <!-- translated in the component.ts and the value set according to enableCompareTo status (Within / Later Date) -->
        <div
          data-auto-id="agenda_setup_date_range_label"
          class="top-line secondary-text d-flex"
        >
          {{ _dateRangeLabelText }}
        </div>

        <da-date-picker
          *ngIf="!!dateRange"
          class="long-select"
          [selectedRange]="dateRange"
          [selectedDateType]="dateRange.dateRangeType"
          (onChange)="onDateChange($event)"
        ></da-date-picker>
      </div>
      <!-- compare to Date range -->
      <div
        *ngIf="allowNewBotType()"
        class="d-flex align-center mt-30"
        [ngClass]="{ 'mt-30': !isCompareToEnabled }"
      >
        <dato-checkbox
          [formControl]="agenda.controls.enableCompareTo"
          [ngClass]="{ 'mt-30': isCompareToEnabled }"
          transloco="13"
          class="mx-10"
        >
        </dato-checkbox>
        <div [ngClass]="{ 'd-flex-column': isCompareToEnabled }">
          <div
            *ngIf="isCompareToEnabled; else isCompareToDisabled"
            transloco="14"
            class="top-line secondary-text d-flex"
          ></div>
          <ng-template #isCompareToDisabled>
            <span
              transloco="15"
              class="primary-200-color primary-50-background-color d-flex align-start-center px-10 long-select"
            ></span>
          </ng-template>
          <da-date-picker
            *ngIf="!!compareToDateRange && isCompareToEnabled"
            class="long-select"
            [selectedRange]="compareToDateRange"
            [selectedDateType]="compareToDateRange.dateRangeType"
            (onChange)="onCompareToDateChange($event)"
          >
          </da-date-picker>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div
      class="my-agenda-header d-flex"
      [transloco]="condition ? dontTake : inner ? '16' : '17'"
    ></div>
    <div class="d-flex">
      <div class="add-filter-button" (click)="addFiltersModal($event)">
        <dato-icon datoIcon="plus-round" class="icon"></dato-icon>
      </div>
      <span
        class="add-filter-text"
        (click)="addFiltersModal($event)"
        transloco="18"
      ></span>
    </div>
    <!-- Header -->
    <div class="my-agenda-header d-flex" transloco="19"></div>
    <div class="my-agenda-header d-flex" transloco="{{ '20' }}"></div>
    <div
      class="my-agenda-header d-flex"
      transloco="{{ condition ? '21' : dontTake }}"
    ></div>
    <div
      class="my-agenda-header d-flex"
      transloco="{{ condition ? dontTake : condition2 ? '22' : '23' }}"
    ></div>
  </div> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'admin-page', alias: 'adminPage' },
    },
  ],
})
export class NavPartitionsComponent implements OnInit, OnDestroy {}
