import type { LinkingOptions } from '@react-navigation/native';

import { WEB_BASE_URL } from '../config';
import type { RootStackParamList } from './types';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [WEB_BASE_URL, 'wishlistios://'],
  config: {
    screens: {
      Landing: '',
      Login: 'login',
      Register: 'register',
      Dashboard: 'dashboard',
      Wishlist: 'wishlist/:slug',
    },
  },
};