import { eventChannel } from "@redux-saga/core";
import io from "socket.io-client";
import { getAccessToken } from "../../utils/accessToken";
import { errorHandler, signInSuccess } from "./handlers/socketHandlers";

let socket: any = null;

// Initialize socket with accessToken.
// Once the socket is active(i.e connected) the client is marked authorized.
// No refresh of accessToken needed in this case (Only refresh when reconnecting,
// or trying to make an API call
// ).

export const initializeSocket = () => {
  socket = io(process.env.REACT_APP_SERVER_URL as string, {
    // Set cred to false as no need to send cookies
    withCredentials: false,
    auth: (cb) => {
      cb({
        accessToken: getAccessToken(),
      });
    },
  });
  return new Promise((resolve) => {
    socket.on("connect", () => {
      resolve(socket);
    });
  });
};

export const disconnectSocket = () => {
  socket = io(process.env.REACT_APP_SERVER_URL as string, {
    withCredentials: false,
    auth: (cb) => {
      cb({
        accessToken: getAccessToken(),
      });
    },
  });
  return new Promise((resolve) => {
    socket.on("disconnect", () => {
      resolve(socket);
    });
  });
};

export const reconnectSocket = () => {
  socket = io(process.env.REACT_APP_SERVER_URL as string, {
    withCredentials: false,
    auth: (cb) => {
      cb({
        accessToken: getAccessToken(),
      });
    },
  });
  return new Promise((resolve) => {
    socket.on("reconnect", () => {
      resolve(socket);
    });
  });
};

export const createSocketChannel = (socket: any) => {
  // `eventChannel` takes a subscriber function
  // the subscriber function takes an `emit` argument to put messages onto the channel
  return eventChannel((emit) => {
    // setup the subscription
    socket.on("signInSuccess", (event: any) => signInSuccess(event, emit));
    socket.on("error", (event: any) => errorHandler(event, emit));

    // the subscriber must return an unsubscribe function
    // this will be invoked when the saga calls `channel.close` method
    const unsubscribe = () => {
      socket.off("signInSuccess", (event: any) => signInSuccess(event, emit));
    };

    return unsubscribe;
  });
};

export const getActiveSocket = () => socket;
