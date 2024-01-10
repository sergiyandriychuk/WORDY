import {Injectable} from '@angular/core';
import {firstValueFrom} from 'rxjs';

import {ApiService} from '@app/shared/services/api.service';
import {GetKnownWordsResponse, GetUrlsLibraryResponse} from '@app/shared/models';

@Injectable()
export class WordsService {

  constructor(
    private apiSvc: ApiService
  ) {
  }

  public async getKnownWords(
    from: string, to: string, perPage: number, page: number, letter?: string | null, word: string = ''
  ): Promise<GetKnownWordsResponse> {
    let url: string = `/translate/known?from=${from}&to=${to}&count=${perPage}&page=${page}`;

    if (word) {
      url += `&search=${word}`;
    } else if (letter) {
      url += `&search=${letter}`;
    }

    return firstValueFrom(this.apiSvc.get(url));
  }

  public async postDetachKnownWords(translationId: number): Promise<void> {
    return firstValueFrom(this.apiSvc.delete(`/translate/known/${translationId}`));
  }

  public async postAttachKnownWords(translationId: number): Promise<void> {
    return firstValueFrom(this.apiSvc.post(`/translate/known/${translationId}`));
  }

  public async getUrlsLibrary(
    from: string, to: string, perPage: number, page: number, letter?: string | null, word: string = ''
  ): Promise<GetUrlsLibraryResponse> {
    let url: string = `/urls?from=${from}&to=${to}&count=${perPage}&page=${page}`;

    if (word) {
      url += `&search=${word}`;
    } else if (letter) {
      url += `&search=${letter}`;
    }

    return firstValueFrom(this.apiSvc.get(url));
  }

  public async deleteUrlsLibraryItem(urlsLibraryItemId: number): Promise<any> {
    return firstValueFrom(this.apiSvc.delete(`/urls/${urlsLibraryItemId}`));
  }

}
