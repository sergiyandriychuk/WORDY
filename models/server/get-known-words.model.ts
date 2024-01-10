import {KnownWord, Pagination} from '@app/shared/models';

export interface GetKnownWordsResponse extends Pagination<KnownWord> {
}
