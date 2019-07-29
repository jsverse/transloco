import { TranslocoService, TranslocoPipe, DefaultParser } from '../../public-api';
import { Mock } from 'ts-mocks';
import { ChangeDetectorRef } from '@angular/core';
import { load, runLoader } from './transloco.mocks';
import {fakeAsync, tick} from '@angular/core/testing';
import { DefaultHandler } from '../transloco-missing-handler';
import Spy = jasmine.Spy;
import {of} from "rxjs";
import createSpy = jasmine.createSpy;

describe('TranslocoPipe', () => {
  let translateServiceMock;
  let cdrMock;
  let pipe: TranslocoPipe;

  beforeEach(() => {
    translateServiceMock = new Mock<TranslocoService>(
      new TranslocoService(load, new DefaultParser(), new DefaultHandler(), {})
    ).Object;
    cdrMock = new Mock<ChangeDetectorRef>({ markForCheck: () => {} }).Object;
    pipe = new TranslocoPipe(translateServiceMock, {}, cdrMock);
    spyOn(pipe, 'updateValue').and.callThrough();
  });

  describe('updateValue', () => {
    it('should update the value, set the cache and mark for check', fakeAsync(() => {
      const key = 'home';
      pipe.transform(key);
      expect(pipe.lastKey).toBe(key);
      expect(pipe.lastParams).toEqual({});
      runLoader();
      expect(pipe.updateValue).toHaveBeenCalledWith(key, {});
      expect(pipe.value).toBe('home english');
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    }));

    it('should set the value to the key if no translation exists', fakeAsync(() => {
      const key = 'kazaz';
      pipe.transform(key);
      runLoader();
      expect(pipe.value).toBe(key);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    }));
  });

  describe('transform', () => {
    it('should unsubscribe after one emit when not in runtime mode', fakeAsync(() => {
      pipe = new TranslocoPipe(translateServiceMock, {runtime: false}, cdrMock);
      pipe.transform('home');
      const spy = createSpy().and.callThrough();
      pipe.subscription.unsubscribe = spy;
      runLoader();
      expect(spy).toHaveBeenCalled();
      expect(pipe.subscription).toBe(null);
    }));

    it('should return the key when the key is falsy', () => {
      expect(pipe.transform('')).toBe('');
      expect(pipe.transform(null)).toBe(null);
      expect(pipe.transform(undefined)).toBe(undefined);
    });

    it('should perform translate', fakeAsync(() => {
      pipe.transform('home');
      runLoader();
      expect(pipe.value).toBe('home english');
    }));

    it('should perform translate with params', fakeAsync(() => {
      pipe.transform('alert', { value: 'value' });
      runLoader();
      expect(pipe.value).toBe('alert value english');
    }));

    it('should return the value from the cache', fakeAsync(() => {
      pipe.transform('home');
      runLoader();
      expect(pipe.updateValue).toHaveBeenCalled();
      (pipe.updateValue as Spy).calls.reset();
      pipe.transform('home');
      expect(pipe.updateValue).not.toHaveBeenCalled();
      pipe.transform('a.b.c');
      expect(pipe.updateValue).toHaveBeenCalled();
    }));

    fit('should return the value from the cache with params', fakeAsync(() => {
      pipe.transform('alert', { value: 'value' });
      runLoader();
      expect(pipe.updateValue).toHaveBeenCalled();
      (pipe.updateValue as Spy).calls.reset();
      pipe.transform('alert', { value: 'value' });
      expect(pipe.updateValue).not.toHaveBeenCalled();
      pipe.transform('alert', { value: 'bla' });
      expect(pipe.updateValue).toHaveBeenCalled();
    }));
  });

  it('should unsubscribe on destroy', () => {
    pipe.subscription = of().subscribe();
    spyOn(pipe.subscription, 'unsubscribe');
    pipe.ngOnDestroy();
    expect(pipe.subscription.unsubscribe).toHaveBeenCalled();
  });

});
