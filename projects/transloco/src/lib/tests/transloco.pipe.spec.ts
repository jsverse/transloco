import { TranslocoService, TranslocoPipe, DefaultParser } from '@ngneat/transloco';
import { Mock } from 'ts-mocks';
import { ChangeDetectorRef } from '@angular/core';
import { load, runLoader } from './transloco.mocks';
import { fakeAsync } from '@angular/core/testing';
import { DefaultHandler } from '../transloco-missing-handler';
import Spy = jasmine.Spy;

describe('TranslocoParamsPipe', () => {
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

    it('should return the value from the cache with params', fakeAsync(() => {
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
});
