import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {AbstractControl, FormControl} from '@angular/forms';

@Component({
  selector: 'app-simple-textarea',
  templateUrl: './simple-textarea.component.html',
  styleUrls: ['./simple-textarea.component.scss']
})
export class SimpleTextareaComponent implements OnInit, OnChanges {

  private defaultMatIconName: string = 'edit';
  private defaultType: string = 'text';
  private defaultInputControl: FormControl = new FormControl('');

  @Input() public matIconName: string = this.defaultMatIconName;
  @Input() public type: string = this.defaultType;
  @Input() public inputControl: AbstractControl = this.defaultInputControl;
  @Input() public placeholder: string = '';
  @Input() public enableMatIcon: boolean = true;

  @Output() public onInput: EventEmitter<Event> = new EventEmitter<Event>();
  @Output() public onChange: EventEmitter<Event> = new EventEmitter<Event>();

  constructor() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!changes['matIconName']?.currentValue && !this.matIconName) {
      this.matIconName = this.defaultMatIconName;
    }

    if (!changes['type']?.currentValue && !this.type) {
      this.type = this.defaultType;
    }

    if (!changes['defaultInputControl']?.currentValue && !this.inputControl) {
      this.inputControl = this.defaultInputControl;
    }
  }

  ngOnInit() {
  }

  public inputHandler(event: Event): void {
    this.onInput.emit(event);
  }

  public changeHandler(event: Event): void {
    this.onChange.emit(event);
  }

}
