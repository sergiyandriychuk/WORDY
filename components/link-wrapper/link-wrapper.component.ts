import {Component, Input, OnInit} from '@angular/core';

export type LinkType = 'router' | 'url'
export type UrlTarget = '_self' | '_blank'

@Component({
  selector: 'app-link-wrapper',
  templateUrl: './link-wrapper.component.html',
  styleUrls: ['./link-wrapper.component.scss']
})
export class LinkWrapperComponent implements OnInit {

  @Input() public routerLink: [string] = ['/'];
  @Input() public urlLink: string = '#';
  @Input() public linkType: LinkType = 'router';
  @Input() public underline: boolean = false;
  @Input() public urlTarget: UrlTarget = '_self';

  constructor() {
  }

  ngOnInit() {
  }

  public get isRouterLink(): boolean {
    return this.linkType === 'router';
  }

  public get isUrlLink(): boolean {
    return this.linkType === 'url';
  }

}
