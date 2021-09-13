const { ObjectID, ObjectId } = require("bson");
const { verify } = require("jsonwebtoken");
const {
  addToActiveUsers,
  getActiveUserByObjectId,
  removeActiveUserByObjectId,
} = require("./utils/activeUsers");
const { mongoDB } = require("./utils/database");

const socketMain = async (io, socket) => {
  try {
    const jwtToken = socket.handshake.auth.accessToken;
    const { _id } = verify(jwtToken, process.env.JWT_ACCESS_SECRET);

    // MongoDb instance;
    const db = await mongoDB().db();

    // My detail
    const userPayload = await db
      .collection("googleAuthUsers")
      .findOne({ _id: ObjectID(_id) });

    // All users data
    const users = await db.collection("googleAuthUsers").find().toArray();

    // // Handle User Active Session
    if (!getActiveUserByObjectId(_id)) {
      console.log("New session!");
      // New Session
      addToActiveUsers({
        socketId: socket.id,
        objectId: _id,
      });
    } else {
      console.log("Prev Disconnected, New session!");
      // Old session removed
      const prevSocketId = getActiveUserByObjectId(_id)?.socketId;
      console.log(prevSocketId, io.sockets.sockets.get(prevSocketId));
      if (io.sockets.sockets.get(prevSocketId)) {
        console.log(prevSocketId + "disconnected");
        io.sockets.sockets.get(prevSocketId).emit("multipleSession");
        io.sockets.sockets.get(prevSocketId).disconnect(true);
      }
      removeActiveUserByObjectId(_id);
      // New session added
      addToActiveUsers({
        socketId: socket.id,
        objectId: _id,
      });
    }

    // Signin success state
    socket.emit("signInSuccess", {
      objectId: _id,
      uid: userPayload.uid,
      displayName: userPayload.displayName,
      email: userPayload.email,
      avatar: userPayload.avatar,
      createdOn: userPayload.createdOn,
      about: userPayload.about,
      lastSeen: userPayload.lastSeen,
    });

    // Send users existing in DB back to sender
    socket.on("getTotalUsers", () => {
      // get total users (less size compared to chat data so we can use socket.io here,
      // otherwise its better to use REST)
      const filterUsers = users
        .filter((me) => me._id != _id)
        .map((user) => {
          return {
            ...user,
            status: getActiveUserByObjectId(user._id.toString()) ? true : false,
          };
        });

      // emit the entire user list to client
      socket.emit("setInitialTotalUsers", filterUsers);
    });

    // Update logged user state to others
    socket.broadcast.emit("updateTotalUsers", {
      objectId: userPayload._id,
      uid: userPayload.uid,
      displayName: userPayload.displayName,
      email: userPayload.email,
      avatar: userPayload.avatar,
      createdOn: userPayload.createdOn,
      about: userPayload.about,
      lastSeen: userPayload.lastSeen,
    });

    // handle incoming messages
    socket.on("iTextMessage", async (payload) => {
      console.log(payload);
      const { type, msgType, msgParams, refId, timestamp, sentBy, tempId } =
        payload;

      const { participants } = await db.collection(`${type}s`).findOne({
        _id: ObjectId(refId),
      });

      await db.collection("messages").insertOne(
        {
          type,
          msgType,
          msgParams,
          refId: ObjectId(refId),
          timestamp,
          sentBy: ObjectId(sentBy),
        },
        (err, data) => {
          if (err) {
            throw Error(err);
          }

          for (let i = 0; i < participants.length; i++) {
            if (participants[i].toString() != sentBy.toString()) {
              const activeFriends = getActiveUserByObjectId(participants[i]);
              if (activeFriends.socketId) {
                io.to(activeFriends.socketId).emit("recieveMessage", {
                  _id: data._id,
                  type,
                  msgType,
                  msgParams,
                  refId: ObjectId(refId),
                  timestamp,
                  sentBy: ObjectId(sentBy),
                });
              }
            }
          }

          socket.emit("messageSentSuccessfully", {
            tempId: tempId,
            refId,
            _id: data._id,
          });
        }
      );
    });

    // Handle online status
    socket.broadcast.emit("online", _id);

    // Handle disconnect event
    socket.on("disconnect", async () => {
      // timestamp
      const lastSeen = Date.now();

      // update last seen of disconnected user
      await db.collection("googleAuthUsers").updateOne(
        { _id: ObjectID(_id) },
        {
          $set: { lastSeen },
        }
      );

      // tell others that this user is disconnected
      socket.broadcast.emit("offline", {
        _id,
        lastSeen,
      });

      // remove users frm the active list
      removeActiveUserByObjectId(_id);
      console.log(socket.id, "Disconnected");
    });
  } catch (err) {
    console.log("MAIN SOCKET ERR", err);
  }
};

module.exports = socketMain;
