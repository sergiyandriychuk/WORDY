import {Environment} from '@src/environments/environment.model';

export const environment: Environment = {
  production: false,
  apiUrl: 'https://impyouridea.uk/api/v1',
  googleAuthUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  googleAuth: {
    client_id: '440654159673-u9hvg941vk1jmc60rvlgbegcpa2e60lh.apps.googleusercontent.com',
    redirect_uri: 'http://localhost:4200/login',
    response_type: 'token',
    scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
    include_granted_scopes: 'true',
    state: 'pass-through value'
  }
};
