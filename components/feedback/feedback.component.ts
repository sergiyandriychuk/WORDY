import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {Router} from '@angular/router';
import {Subject, takeUntil} from 'rxjs';

import {
  DialogService,
  FeedbackService,
  FormService,
  LocalizeService,
  UserService,
  UtilsService
} from '@app/shared/services';
import {MAX_FB_MESSAGE_LEN} from '@app/shared/constants/form.constants';
import {FeedbackData, PostFeedbackBody} from '@app/shared/models';

@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.scss']
})
export class FeedbackComponent implements OnInit, OnDestroy {

  public feedbackForm!: FormGroup;
  public submittingFeedback: boolean = false;
  public maxCounterValue: number = MAX_FB_MESSAGE_LEN;

  private feedbackData: FeedbackData | null = null;
  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private router: Router,
    private formSvc: FormService,
    private dialogSvc: DialogService,
    private utilsSvc: UtilsService,
    private localizeSvc: LocalizeService,
    private userSvc: UserService,
    private feedbackSvc: FeedbackService
  ) {
  }

  ngOnInit() {
    this.buildFeedbackForm();

    this.feedbackSvc.feedbackData$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: FeedbackData | null) => {
        if (data && !this.feedbackData) {
          this.feedbackData = data;
          this.feedbackDataHandler();
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next(true);
  }

  public get messageLength(): number {
    if (!this.feedbackForm) {
      return 0;
    }

    return this.feedbackForm.controls['message'].value.length;
  }

  public get invalidMessageLength(): boolean {
    if (!this.feedbackForm) {
      return false;
    }

    return this.messageLength > this.maxCounterValue;
  }

  private get feedbackFormValues() {
    return {
      subject: this.feedbackForm.controls['subject'].value?.trim(),
      message: this.feedbackForm.controls['message'].value?.trim(),
      url: this.feedbackForm.controls['url']?.value?.trim()
    };
  }

  private buildFeedbackForm(): void {
    this.feedbackForm = new FormGroup({
      subject: new FormControl('', this.formSvc.getFBSubjectControlValidators()),
      message: new FormControl('', this.formSvc.getFBMessageControlValidators())
    });
  }

  private addURLControl(): void {
    this.feedbackForm.addControl('url', new FormControl({
      value: '',
      disabled: true
    }));
  }

  private async feedbackDataHandler(): Promise<void> {
    try {
      if (this.feedbackData && this.feedbackData.type === 'invalid-lang') {
        await new Promise(resolve => setTimeout(resolve, 100));
        await this.localizeSvc.onLangLoad();

        this.feedbackForm.controls['subject'].patchValue(this.localizeSvc.translate('COMPONENTS.FEEDBACK.SUBJECT_TEXT'));

        this.addURLControl();

        this.feedbackForm.controls['url'].patchValue(this.feedbackData.url);
        this.feedbackForm.controls['message'].patchValue(this.localizeSvc.translate('COMPONENTS.FEEDBACK.MESSAGE_TEXT'));
      }
    } catch (e) {
      console.error(e);
      this.dialogSvc.warningDialog(this.utilsSvc.getErrorMessage(e));
    }
  }

  public async submitFeedback(): Promise<void> {
    try {
      if (this.feedbackForm.invalid || this.submittingFeedback) {
        return;
      }
      this.submittingFeedback = true;

      const body: PostFeedbackBody = {
        subject: this.feedbackFormValues.subject,
        message: this.feedbackFormValues.message
      };

      if (this.feedbackData?.type === 'invalid-lang' && this.feedbackData?.url && this.feedbackData.lang) {
        body.url = this.feedbackData.url;
        body.from = this.feedbackData.lang;
      }

      await this.userSvc.sendFeedback(body);

      await this.router.navigate(['vocabulary']);
      this.feedbackForm.reset();
      this.feedbackSvc.destroyFeedbackData(this.feedbackData!.id);

      this.submittingFeedback = false;
    } catch (e) {
      console.error(e);
      this.dialogSvc.warningDialog(this.utilsSvc.getErrorMessage(e));
      this.submittingFeedback = false;
    }
  }

}
