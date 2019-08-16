import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TranspilersComponent } from './transpilers.component';

describe('TranspilersComponent', () => {
  let component: TranspilersComponent;
  let fixture: ComponentFixture<TranspilersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TranspilersComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TranspilersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
