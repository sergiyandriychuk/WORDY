import {Pipe, PipeTransform} from '@angular/core';

import {CurrencyName} from '@app/shared/models';

@Pipe({
  name: 'currencySymbol'
})
export class CurrencySymbolPipe implements PipeTransform {

  public transform(currencyName?: CurrencyName): string | undefined {
    switch (currencyName) {
      case 'eur':
        return '€';
      default:
        return currencyName || 'UC';
    }
  }

}
