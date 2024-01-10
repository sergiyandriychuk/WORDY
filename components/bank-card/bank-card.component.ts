import {Component, Input, OnInit} from '@angular/core';

import {CardType} from '@app/shared/models';

@Component({
  selector: 'app-bank-card',
  templateUrl: './bank-card.component.html',
  styleUrls: ['./bank-card.component.scss']
})
export class BankCardComponent implements OnInit {

  @Input() public cardType?: CardType;
  @Input() public lastNumbers?: string;

  constructor() {
  }

  ngOnInit() {
  }

}
