import { SetMetadata } from '@nestjs/common';

export const USER_ONLY_KEY = 'userOnly';
export const UserOnly = () => SetMetadata(USER_ONLY_KEY, true);

