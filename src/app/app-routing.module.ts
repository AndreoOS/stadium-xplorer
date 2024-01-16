import { ExtraOptions, RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { EsriMapComponent } from './pages/esri-map/esri-map.component';
import { HomeComponent } from './pages/home/home.component';
import { SignInComponent } from './pages/components/sign-in/sign-in.component';
import { SignUpComponent } from './pages/components/sign-up/sign-up.component';
import { DashboardComponent } from './pages/components/dashboard/dashboard.component';
import { ForgotPasswordComponent } from './pages/components/forgot-password/forgot-password.component';
import { VerifyEmailComponent } from './pages/components/verify-email/verify-email.component';
import { AuthGuard } from './shared/guard/auth.guard';
import { LandingPageComponent } from './pages/components/landing-page/landing-page.component';

export const routes: Routes = [
  {path: 'home', component: HomeComponent},
  { path: 'map', component: EsriMapComponent },
  { path: '', redirectTo: '/landing-page', pathMatch: 'full' },
  { path: 'landing-page', component: LandingPageComponent},
  { path: 'sign-in', component: SignInComponent },
  { path: 'register-user', component: SignUpComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'verify-email-address', component: VerifyEmailComponent },
];

const config: ExtraOptions = {
  useHash: false,
};

@NgModule({
  imports: [RouterModule.forRoot(routes, config)],
  exports: [RouterModule],
})
export class AppRoutingModule {
}
