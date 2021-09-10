import guestAvatars from "../../data/guestAvatars.json";
import { takeLatest, call, put } from "@redux-saga/core/effects";
import {
  initiateLogout,
  initiateSignin,
  logout,
  setAuthSuccess,
  setSocketConnectionSuccess,
} from "../reducers/auth";
import { v4 as uuidv4 } from "uuid";
import { getActiveSocket, initializeSocket } from "../sockets/socketConnection";
import { getAccessToken, setAccessToken } from "../../utils/accessToken";

// Google SignIn -------------------------------------------
const googleSignin = async (payload: any) => {
  const data = await fetch(
    `${process.env.REACT_APP_SERVER_URL}/g-auth/authenticate`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tokenId: payload.idToken,
      }),
    }
  );
  const response = await data.json();
  return response;
};

function* googleSignIn(payload?: any) {
  //@ts-ignore
  const userData = yield call(googleSignin, payload);
  yield setAccessToken(userData.accessToken);
  yield call(initializeSocket);
  //@ts-ignore
  const socket = getActiveSocket();
  if (socket) {
    yield put(setSocketConnectionSuccess());
  }
}

// Guest SignIn ---------------------------------------------------
const handleGuestSignIn = async () => {
  return await initializeSocket();
};

function* guestSignIn(payload?: any) {
  const guestUserData = {
    ...payload,
    uid: uuidv4(),
    displayName: `guest-${Math.floor(Math.random() * 10000)}`,
    email: "guest@wibein-clone.com",
    avatar: guestAvatars[Math.floor(Math.random() * guestAvatars.length)],
    about: "Hey I am a guest user.",
  };
  yield call(handleGuestSignIn);
  yield put(setAuthSuccess(guestUserData));
}

// Signin Saga
export function* initiateSignInSaga() {
  yield takeLatest(initiateSignin.type, function* (action: any) {
    if (action.payload.authType === "guest") {
      yield guestSignIn(action.payload);
    } else {
      yield googleSignIn(action.payload);
    }
  });
}

// Logout Saga
const logoutUser = async () => {
  const data = await fetch(`${process.env.REACT_APP_SERVER_URL}/logout`, {
    method: "GET",
    credentials: "include",
    headers: {
      authorization: `Bearer ${getAccessToken()}`,
    },
  });
  const response = await data.status;
  console.log(response);
  return response;
};

export function* initLogout() {
  yield takeLatest(initiateLogout.type, function* () {
    //@ts-ignore
    const status = yield call(logoutUser);
    if (status === 200) {
      yield put(logout());
    }
  });
}
