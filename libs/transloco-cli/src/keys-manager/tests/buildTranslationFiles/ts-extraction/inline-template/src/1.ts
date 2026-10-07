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

const SEARCH_INTERVAL = 400;
const ITEM_ANIMATION_DURATION = 350;
const SCROLL_ANIMATION = 500;

@Component({
  selector: 'bla-bla',
  template: `<div class="bot-setup-container width-100 d-flex">
    <form class="da-form d-flex-column width-100" [formGroup]="bot" novalidate>
      <!-- Bot name -->
      <div class="bot-setup-header allow-full-line d-flex">
        <da-editable-input-text
          [value]="botSetupStore.bot.controls.name.value"
          [entity]="'bot'"
          (onChange)="onNameChange($event)"
        ></da-editable-input-text>
      </div>

      <edge-wizard-step
        transloco="Restore Options"
        [validate]="simulateRestore"
        [useFormCtrlValidation]="profile"
      >
        <ui-view [transloco]="'Processing archive...'"></ui-view>

        <!-- Footer error message -->
        <div
          class="footer-error-message d-flex"
          *ngIf="errorCounter > 0"
          [transloco]="dontTake"
        >
          asasd
        </div>
        <div class="allow-full-line footer-buttons d-flex align-end-center">
          <div class="setup-buttons d-flex">
            <button
              class="da-btn secondary link footer cancel-button"
              type="button"
              [transloco]="'1'"
              (click)="backToPrevPage(false)"
            ></button>
            <button
              transloco="2"
              class="da-btn secondary save-button"
              *ngIf="isEditState && !isDuplicate as bla"
              (click)="onSubmit(false)"
            ></button>
            <button
              class="da-btn primary save-run-button"
              (click)="onSubmit(true)"
              transloco="3"
            ></button>
          </div>
        </div>
      </edge-wizard-step>
    </form>
  </div> `,
})
export class Something implements OnInit, AfterViewInit, OnDestroy {}
