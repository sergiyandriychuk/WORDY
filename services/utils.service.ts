import {Injectable} from '@angular/core';
import {cloneDeep} from 'lodash';
import {nanoid} from 'nanoid';
import {Alphabets} from '@app/shared/models';

@Injectable()
export class UtilsService {

  constructor() {
  }

  public getUniqueId(): string {
    return nanoid();
  }

  public getErrorMessage(error: any): string {
    const defaultErrorMessage: string = 'Unknown error';

    try {
      return error?.message || defaultErrorMessage;
    } catch (e) {
      console.error(e);
      return defaultErrorMessage;
    }
  }

  public getCurrentUrl(): string {
    return window.location.href;
  }

  public selector(selectors: string): HTMLElement | null {
    return document.querySelector(selectors);
  }

  public objectClone<T>(obj: T): T {
    if (!obj) {
      return obj;
    }

    return cloneDeep(obj);
  }

  public getAlphabets(): Alphabets {
    return {
      en: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'],
      de: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'ä', 'ö', 'ü'],
      es: ['a', 'á', 'b', 'c', 'd', 'e', 'é', 'f', 'g', 'h', 'i', 'í', 'j', 'k', 'l', 'm', 'n', 'ñ', 'o', 'ó', 'p', 'q', 'r', 's', 't', 'u', 'ú', 'ü', 'v', 'w', 'x', 'y', 'z'],
      uk: ['а', 'б', 'в', 'г', 'ґ', 'д', 'е', 'є', 'ж', 'з', 'и', 'і', 'ї', 'й', 'к', 'л', 'м', 'н', 'о', 'п', 'р', 'с', 'т', 'у', 'ф', 'х', 'ц', 'ч', 'ш', 'щ', 'ю', 'я'],
      pl: ['a', 'ą', 'b', 'c', 'ć', 'd', 'e', 'ę', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'ł', 'm', 'n', 'ń', 'o', 'ó', 'p', 'r', 's', 'ś', 't', 'u', 'w', 'y', 'z', 'ź', 'ż'],
      fr: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'],
      ru: ['а', 'б', 'в', 'г', 'д', 'е', 'ё', 'ж', 'з', 'и', 'й', 'к', 'л', 'м', 'н', 'о', 'п', 'р', 'с', 'т', 'у', 'ф', 'х', 'ц', 'ч', 'ш', 'щ', 'ы', 'э', 'ю', 'я'],
      ar: []
    };
  }

  public isObject(obj: any): boolean {
    return typeof obj === 'object' && !Array.isArray(obj) && obj !== null;
  }

  public dateIsValid(date: Date): boolean {
    return date as any instanceof Date && !isNaN(date as any);
  }

}
