import {Component, Input, OnInit} from '@angular/core';

export type SvgIconName =
  'book-outline'
  | 'library-outline'
  | 'credit-card-outline'
  | 'message'
  | 'open-line'

@Component({
  selector: 'app-svg-icon',
  templateUrl: './svg-icon.component.html',
  styleUrls: ['./svg-icon.component.scss']
})
export class SvgIconComponent implements OnInit {

  @Input() public name!: SvgIconName;

  constructor() {
  }

  ngOnInit() {
  }

}
