import {Component, OnInit} from '@angular/core';

import {UiService} from '@app/shared/services';
import {SvgIconName} from '@app/shared/components';

export interface SidenavItem {
  routerLink: string;
  icon: SvgIconName;
  titleLocalizeKey: string;
}

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss']
})
export class SidenavComponent implements OnInit {

  public sidenavItems: SidenavItem[] = [{
    routerLink: '/vocabulary',
    icon: 'book-outline',
    titleLocalizeKey: 'COMPONENTS.SIDENAV.VOCABULARY'
  }, {
    routerLink: '/urls-library',
    icon: 'library-outline',
    titleLocalizeKey: 'COMPONENTS.SIDENAV.URLS_LIBRARY'
  }, {
    routerLink: '/billing',
    icon: 'credit-card-outline',
    titleLocalizeKey: 'COMPONENTS.SIDENAV.BILLING'
  }, {
    routerLink: '/feedback',
    icon: 'message',
    titleLocalizeKey: 'COMPONENTS.FEEDBACK.TITLE'
  }];

  constructor(
    private uiSvc: UiService
  ) {

  }

  ngOnInit() {
  }

  public hideMobileSidenav(): void {
    this.uiSvc.setMobileSidenavVisible(false);
  }

}
