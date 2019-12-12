import { Component } from '@angular/core';
import { EsCommonService } from '@es-common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'es-project-demo';
  constructor(private common: EsCommonService) {}
}
