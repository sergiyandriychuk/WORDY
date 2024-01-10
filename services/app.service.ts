import {Injectable} from '@angular/core';

import {LocalizeService} from '@app/shared/services/localize.service';
import {UserService} from '@app/shared/services/user.service';

@Injectable()
export class AppService {

  constructor(
    private localizeSvc: LocalizeService,
    private userSvc: UserService
  ) {
  }

  public async initializeApp(): Promise<void> {
    this.localizeSvc.init();
    await this.userSvc.populate();
  }

}
