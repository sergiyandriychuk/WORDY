import {User} from '@app/shared/models';

export interface PostRegisterBody {
  name: string;
  email: string;
  password: string;
}

export interface PostRegisterResponse {
  token: string;
  user: User;
}
