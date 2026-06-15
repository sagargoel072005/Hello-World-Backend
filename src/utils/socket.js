const socket = require("socket.io");
const crypto = require("crypto");
const { Chat } = require("../models/chat");
const ConnectionRequest = require("../models/connectionRequest");
const { Server } = require("socket.io");

const getSecretRoomId = (userId, targetUserId) => {
  return crypto
    .createHash("sha256")
    .update([userId, targetUserId].sort().join("$"))
    .digest("hex");
};


const initializeSocket = (server) => {
  const io = socket(server, {
    cors: {
      origin: "http://localhost:5173",
    },
  });

  io.on("connection", (socket) => {
    socket.on("joinChat", ({ firstName, userId, targetUserId }) => {
      const roomId = getSecretRoomId(userId, targetUserId);
      socket.join(roomId);
    });

//     socket.on(
//       "sendMessage",
//       async ({ firstName, lastName, userId, targetUserId, text }) => {
//         // Save messages to the database
//         try {
//           const roomId = getSecretRoomId(userId, targetUserId);

//           // TODO: Check if userId & targetUserId are friends

//           let chat = await Chat.findOne({
//             participants: { $all: [userId, targetUserId] },
//           });

//           if (!chat) {
//             chat = new Chat({
//               participants: [userId, targetUserId],
//               messages: [],
//             });
//           }

//           chat.messages.push({
//             senderId: userId,
//             text,
//           });

//           await chat.save();
//           socket.to(roomId).emit("messageReceived", {
//   senderId: userId,
//   firstName,
//   lastName,
//   text,
// });
//         } catch (err) {
//           console.log(err);
//         }
//       }
//     );


socket.on(
  "sendMessage",
  async ({
    firstName,
    lastName,
    userId,
    targetUserId,
    text,
    fileUrl,
    fileType,
  }) => {
    try {
      const roomId = getSecretRoomId(userId, targetUserId);

      let chat = await Chat.findOne({
        participants: { $all: [userId, targetUserId] },
      });

      if (!chat) {
        chat = new Chat({
          participants: [userId, targetUserId],
          messages: [],
        });
      }

      const newMessage = {
        senderId: userId,
        text: text || "",
        fileUrl: fileUrl || "",
        fileType: fileType || "",
      };

      chat.messages.push(newMessage);

      await chat.save();

      socket.to(roomId).emit("messageReceived", {
        senderId: userId,
        firstName,
        lastName,
        text,
        fileUrl,
        fileType,
        createdAt: new Date(),
      });
    } catch (err) {
      console.log(err);
    }
  }
);

    socket.on("disconnect", () => {});


  });
};

module.exports = initializeSocket;