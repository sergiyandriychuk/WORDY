export interface Environment {
  production: boolean;
  apiUrl: string;
  googleAuthUrl: string;
  googleAuth: GoogleAuth;
}

export interface GoogleAuth {
  client_id: string;
  redirect_uri: string;
  response_type: string;
  scope: string;
  include_granted_scopes: string;
  state: string;
}
