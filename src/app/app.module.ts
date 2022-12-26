import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";

import { AppComponent } from "./app.component";
import { EsriMapComponent } from "./pages/esri-map/esri-map.component";
import { AppRoutingModule } from "./app-routing.module";

import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFireStorageModule } from '@angular/fire/compat/storage';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireDatabaseModule } from '@angular/fire/compat/database';
import { environment } from '../environments/environment';
import { DashboardComponent } from './pages/components/dashboard/dashboard.component';
import { SignInComponent } from './pages/components/sign-in/sign-in.component';
import { SignUpComponent } from './pages/components/sign-up/sign-up.component';
import { ForgotPasswordComponent } from './pages/components/forgot-password/forgot-password.component';
import { VerifyEmailComponent } from './pages/components/verify-email/verify-email.component';
import { AuthService } from "./shared/services/auth.service";
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [
    AppComponent, 
    EsriMapComponent],
  imports: [BrowserModule, 
    AppRoutingModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFirestoreModule,
    AngularFireStorageModule,
    AngularFireDatabaseModule,
    RouterModule
  ],
  providers: [AuthService],
  bootstrap: [AppComponent]
})
export class AppModule { }
