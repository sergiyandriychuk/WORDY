import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
  selector: 'app-remove-modal',
  templateUrl: './remove-modal.component.html',
  styleUrls: ['./remove-modal.component.scss']
})
export class RemoveModalComponent implements OnInit {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {item: string, cancelSubscription?: boolean}
  ) {
  }

  ngOnInit() {
  }

}
