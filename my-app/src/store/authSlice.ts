import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type UserModel from '../components/user/UserModel'; 

// interface User {
//   id: string;
//   name: string;
//   email: string;
//   role: string;
// }

interface AuthState {
  token: string | null;
  user: UserModel | null;
}

const initialState: AuthState = {
  token: null,
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess(state, action: PayloadAction<{ token: string; user: UserModel }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
    },
    logout(state) {
      state.token = null;
      state.user = null;
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;