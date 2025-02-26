import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app.config';
import { AppComponent } from './app.component';

bootstrapApplication(
    AppComponent,
    appConfig
)
.then(success => console.log('App Bootstrap Load', success))
.catch((err) => console.log(err));
