import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {ActivatedRoute, Params, Router} from '@angular/router';

import {
  DialogService,
  FormService,
  LocalizeService,
  TokenService,
  UiService,
  UserService,
  UtilsService
} from '@app/shared/services';
import {AuthType, PostLoginBody, PostLoginResponse, PostRegisterBody, PostRegisterResponse} from '@app/shared/models';
import {GoogleAuth} from '@src/environments/environment.model';
import {environment} from '@src/environments/environment';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent implements OnInit {

  public signInForm!: FormGroup;
  public signUpForm!: FormGroup;
  public submittingSignIn: boolean = false;
  public submittingGoogleSignIn: boolean = false;
  public submittingSignUp: boolean = false;
  public gettingToken: boolean = false;

  private authType: AuthType | null = null;

  constructor(
    private formSvc: FormService,
    private dialogSvc: DialogService,
    private utilsSvc: UtilsService,
    private userSvc: UserService,
    private router: Router,
    private tokenSvc: TokenService,
    private activatedRoute: ActivatedRoute,
    private localizeSvc: LocalizeService,
    private uiSvc: UiService
  ) {
    this.uiSvc.showLoading();
  }

  ngOnInit() {
    this.getAccessToken();

    this.activatedRoute.queryParams.subscribe((params: Params) => {
      if (params['type'] === 'register') {
        this.authType = 'register';
      } else {
        this.authType = 'login';
      }
    });

    this.buildSignInForm();
    this.buildSignUpForm();
  }

  public get isLogin(): boolean {
    return this.authType === 'login';
  }

  public get isRegister(): boolean {
    return this.authType === 'register';
  }

  private get signInFormValues() {
    return {
      email: this.signInForm.controls['email'].value?.trim(),
      password: this.signInForm.controls['password'].value?.trim()
    };
  }

  private get signUpFormValues() {
    return {
      name: this.signUpForm.controls['name'].value?.trim(),
      email: this.signUpForm.controls['email'].value?.trim(),
      password: this.signUpForm.controls['password'].value?.trim(),
      repeatPassword: this.signUpForm.controls['repeatPassword'].value?.trim()
    };
  }

  private buildSignInForm(): void {
    this.signInForm = new FormGroup({
      email: new FormControl('', this.formSvc.getEmailControlValidators()),
      password: new FormControl('', this.formSvc.getPasswordControlValidators())
    });
  }

  private buildSignUpForm(): void {
    this.signUpForm = new FormGroup({
      name: new FormControl('', this.formSvc.getNameControlValidators()),
      email: new FormControl('', this.formSvc.getEmailControlValidators()),
      password: new FormControl('', this.formSvc.getPasswordControlValidators()),
      repeatPassword: new FormControl('', this.formSvc.getPasswordControlValidators())
    });
  }

  public async submitSignIn(): Promise<void> {
    try {
      if (this.signInForm.invalid || this.submittingSignIn) {
        return;
      }
      this.submittingSignIn = true;

      const body: PostLoginBody = {
        email: this.signInFormValues.email,
        password: this.signInFormValues.password
      };

      const res: PostLoginResponse = await this.userSvc.login(body);
      await this.authProcess(res.token);
      this.submittingSignIn = false;
    } catch (e) {
      console.error(e);
      this.dialogSvc.warningDialog(this.utilsSvc.getErrorMessage(e));
      this.submittingSignIn = false;
    }
  }

  public async submitSignUp(): Promise<void> {
    try {
      if (this.signUpForm.invalid || this.submittingSignUp) {
        return;
      }
      this.submittingSignUp = true;

      if (this.signUpFormValues.password !== this.signUpFormValues.repeatPassword) {
        throw new Error('Passwords do not match');
      }

      const body: PostRegisterBody = {
        name: this.signUpFormValues.name,
        email: this.signUpFormValues.email,
        password: this.signUpFormValues.password
      };

      const res: PostRegisterResponse = await this.userSvc.register(body);
      await this.authProcess(res.token);
      this.submittingSignUp = false;
    } catch (e) {
      console.error(e);
      this.dialogSvc.warningDialog(this.utilsSvc.getErrorMessage(e));
      this.submittingSignUp = false;
    }
  }

  public async submitGoogleSignIn(): Promise<void> {
    try {
      if (this.submittingGoogleSignIn || this.gettingToken) {
        return;
      }
      this.submittingGoogleSignIn = true;

      const params: GoogleAuth = environment.googleAuth;
      const authUrl: string = environment.googleAuthUrl;

      const form: HTMLFormElement = document.createElement('form');
      form.setAttribute('method', 'GET');
      form.setAttribute('action', authUrl);

      for (let p in params) {
        const input: HTMLInputElement = document.createElement('input');
        input.setAttribute('type', 'hidden');
        input.setAttribute('name', p);
        // @ts-ignore
        input.setAttribute('value', params[p]);
        form.appendChild(input);
      }

      document.body.appendChild(form);
      form.submit();
      this.submittingGoogleSignIn = false;
    } catch (e) {
      console.error(e);
      this.dialogSvc.warningDialog(
        this.localizeSvc.translate('DIALOGS.ERROR.AUTH.TITLE'),
        this.utilsSvc.getErrorMessage(e)
      );
      this.submittingGoogleSignIn = false;
    }
  }

  private async authProcess(token: string): Promise<void> {
    if (!token) {
      throw new Error('Token not found!');
    }

    this.tokenSvc.setToken(token);
    await this.userSvc.populate();
    await this.router.navigate(['vocabulary']);
  }

  public changeAuthType(type: AuthType): void {
    this.router.navigate(['login'], {
      queryParams: {type}
    });
  }

  private async getAccessToken(): Promise<void> {
    try {
      if (this.gettingToken) {
        return;
      }
      this.gettingToken = true;

      const currentUrl: string = this.utilsSvc.getCurrentUrl();

      if (!currentUrl.includes('access_token')) {
        this.gettingToken = false;
        this.uiSvc.hideLoading();
        return;
      }

      const accessToken: string | null = this.tokenSvc.extractAccessToken(currentUrl);

      if (!accessToken) {
        this.dialogSvc.warningDialog(
          this.localizeSvc.translate('DIALOGS.ERROR.GETTING_TOKEN.TITLE')
        );
        this.gettingToken = false;
        this.uiSvc.hideLoading();
        return;
      }

      const res: PostLoginResponse = await this.userSvc.googleLogin(accessToken);
      this.tokenSvc.setToken(res.token);
      await this.userSvc.populate();
      await this.router.navigate(['vocabulary']);
      this.gettingToken = false;
      this.uiSvc.hideLoading();
    } catch (e) {
      console.error(e);
      this.dialogSvc.warningDialog(
        this.localizeSvc.translate('DIALOGS.ERROR.AUTH.TITLE')
      );
      this.gettingToken = false;
      this.uiSvc.hideLoading();
    }
  }

}
