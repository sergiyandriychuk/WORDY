import {User} from '@app/shared/models';

export interface PostLoginBody {
  email: string;
  password: string;
}

export interface PostLoginResponse {
  token: string;
  user: User;
}
