import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {distinctUntilChanged} from 'rxjs/operators';

import {FeedbackData} from '@app/shared/models';
import {UtilsService} from '@app/shared/services/utils.service';

@Injectable()
export class FeedbackService {

  private _feedbackData$: BehaviorSubject<FeedbackData | null> = new BehaviorSubject<FeedbackData | null>(null);
  public feedbackData$: Observable<FeedbackData | null> = this._feedbackData$.asObservable().pipe(distinctUntilChanged());

  constructor(
    private utilsSvc: UtilsService
  ) {
  }

  public initFeedbackData(feedbackData: FeedbackData | null): void {
    if (feedbackData && this.utilsSvc.isObject(feedbackData)) {
      this._feedbackData$.next(feedbackData);
    }
  }

  public destroyFeedbackData(feedbackDataId: string): void {
    this._feedbackData$.next(null);

    document.dispatchEvent(new CustomEvent('destroy-feedback-data', {
      detail: {
        feedbackDataId
      }
    }));
  }

}
