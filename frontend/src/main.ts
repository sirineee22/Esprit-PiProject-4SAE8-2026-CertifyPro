import { bootstrapApplication } from '@angular/platform-browser';
<<<<<<< HEAD
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { appConfig } from './app/app.config';
import { App } from './app/app';

registerLocaleData(localeFr);

=======
import { appConfig } from './app/app.config';
import { App } from './app/app';

>>>>>>> origin/Trainings-Evaluation
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
