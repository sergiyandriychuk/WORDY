import {Injectable} from '@angular/core';

@Injectable()
export class StorageService {

  private storage: Storage = window.localStorage;

  public get(item: string): any {
    try {
      const lsData: string | null = this.storage.getItem(item);
      return JSON.parse(lsData!);
    } catch (e) {
      return this.storage.getItem(item);
    }
  }

  public set(item: string, value: any): void {
    if (typeof value !== 'string') {
      this.storage.setItem(item, JSON.stringify(value));
    } else {
      this.storage.setItem(item, value);
    }
  }

}
