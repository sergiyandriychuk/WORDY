import {Injectable} from '@angular/core';
import {ValidatorFn, Validators} from '@angular/forms';

import {
  MAX_EMAIL_LEN,
  MAX_FB_MESSAGE_LEN,
  MAX_FB_SUBJECT_LEN,
  MAX_NAME_LEN,
  MAX_PASS_LEN,
  MIN_EMAIL_LEN,
  MIN_FB_MESSAGE_LEN,
  MIN_FB_SUBJECT_LEN,
  MIN_NAME_LEN,
  MIN_PASS_LEN
} from '@app/shared/constants/form.constants';

@Injectable()
export class FormService {

  constructor() {
  }

  public getEmailControlValidators(required: boolean = true): ValidatorFn[] {
    const validators: ValidatorFn[] = [
      Validators.email,
      Validators.minLength(MIN_EMAIL_LEN),
      Validators.maxLength(MAX_EMAIL_LEN)
    ];

    if (required) {
      validators.push(Validators.required);
    }

    return validators;
  }

  public getPasswordControlValidators(required: boolean = true): ValidatorFn[] {
    const validators: ValidatorFn[] = [
      Validators.minLength(MIN_PASS_LEN),
      Validators.maxLength(MAX_PASS_LEN)
    ];

    if (required) {
      validators.push(Validators.required);
    }

    return validators;
  }

  public getNameControlValidators(required: boolean = true): ValidatorFn[] {
    const validators: ValidatorFn[] = [
      Validators.minLength(MIN_NAME_LEN),
      Validators.maxLength(MAX_NAME_LEN)
    ];

    if (required) {
      validators.push(Validators.required);
    }

    return validators;
  }

  public getFBSubjectControlValidators(required: boolean = true): ValidatorFn[] {
    const validators: ValidatorFn[] = [
      Validators.minLength(MIN_FB_SUBJECT_LEN),
      Validators.maxLength(MAX_FB_SUBJECT_LEN)
    ];

    if (required) {
      validators.push(Validators.required);
    }

    return validators;
  }

  public getFBMessageControlValidators(required: boolean = true): ValidatorFn[] {
    const validators: ValidatorFn[] = [
      Validators.minLength(MIN_FB_MESSAGE_LEN),
      Validators.maxLength(MAX_FB_MESSAGE_LEN)
    ];

    if (required) {
      validators.push(Validators.required);
    }

    return validators;
  }

}
