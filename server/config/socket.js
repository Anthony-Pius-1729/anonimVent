import { Server } from "socket.io";
import db from "../config/database.js";

let io;

const generateRoomId = () => {
  return `${
    Math.floor(Math.random() * 10000) * Math.floor(Math.random() * 10000) +
    Math.floor(Math.random() * 10000)
  }-${Math.floor(Math.random() * 500) + Math.floor(Math.random() * 10000)}`;
};

// Store users looking for matches
const matchQueue = new Map();

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);
    console.log(`Total connections: ${io.engine.clientsCount}`);

    // Send connection acknowledgment to client
    socket.emit("connectionEstablished", {
      socketId: socket.id,
      timestamp: new Date().toISOString(),
      message: "Successfully connected to server",
      serverStatus: "online",
    });

    // Handle custom client connect event from client
    socket.on("clientConnect", (data) => {
      console.log(
        `Custom clientConnect event received from ${socket.id}`,
        data
      );

      // Store user data from clientConnect event
      if (data.userId) {
        socket.userId = data.userId;
        socket.userName = data.userName || data.userId;
      }

      // Auto-join room if roomId is provided
      if (data.roomId) {
        socket.join(data.roomId);
        socket.currentRoomId = data.roomId;

        console.log(
          `User ${socket.id} auto-joined room: ${data.roomId} via clientConnect event`
        );

        const roomSize = io.sockets.adapter.rooms.get(data.roomId)?.size || 0;
        console.log(
          `Room ${data.roomId} now has ${roomSize} users after clientConnect event`
        );

        // Notify user they successfully joined via clientConnect
        socket.emit("roomJoinedViaConnect", {
          roomId: data.roomId,
          message: "Successfully joined room via clientConnect event",
          usersInRoom: roomSize,
          navigatedFrom: data.navigatedFrom,
        });

        // Notify others in the room that a new user connected and joined
        socket.to(data.roomId).emit("userConnectedToRoom", {
          message: "Another user has connected to the chat room",
          usersInRoom: roomSize,
          userId: socket.userId,
          userName: socket.userName,
          timestamp: new Date().toISOString(),
        });

        // If room has 2 users, start the chat room immediately
        if (roomSize === 2) {
          console.log(
            `Starting chat room ${data.roomId} - both users connected!`
          );

          io.to(data.roomId).emit("chatRoomStarted", {
            roomId: data.roomId,
            message:
              "Chat room is now active! Both users are connected and ready to chat.",
            usersInRoom: roomSize,
            startedAt: new Date().toISOString(),
            roomStatus: "active",
          });

          // Also emit the standard roomReady event for compatibility
          io.to(data.roomId).emit("roomReady", {
            roomId: data.roomId,
            message: "Both users are connected. You can now start chatting!",
            usersInRoom: roomSize,
          });
        }
      }

      // Send clientConnect acknowledgment back to client
      socket.emit("connectAck", {
        status: "acknowledged",
        socketId: socket.id,
        serverTime: new Date().toISOString(),
        message:
          "Custom clientConnect event processed and room joined successfully",
        roomJoined: !!data.roomId,
        roomSize: data.roomId
          ? io.sockets.adapter.rooms.get(data.roomId)?.size || 0
          : 0,
        clientData: data,
      });

      // Log the clientConnect event details
      console.log(
        `ClientConnect event processed for socket ${
          socket.id
        } at ${new Date().toISOString()}`
      );
    });

    // Handle connection confirmation from client
    socket.on("confirmConnection", (data) => {
      console.log(`Connection confirmed by client: ${socket.id}`, data);
      socket.emit("connectionConfirmed", {
        status: "confirmed",
        serverTime: new Date().toISOString(),
      });
    });

    // Handle ping/pong for connection health
    socket.on("ping", (data) => {
      console.log(`Ping received from ${socket.id}`);
      socket.emit("pong", {
        timestamp: new Date().toISOString(),
        ...data,
      });
    });

    // Handle user authentication and join personal room
    socket.on("authenticate", (userId) => {
      socket.userId = userId;
      socket.userName = userId; // Store the user name for easier reference
      socket.join(userId.toString());

      console.log(`User ${userId} authenticated with socket ${socket.id}`);

      // Send authentication confirmation
      socket.emit("authenticationConfirmed", {
        userId: userId,
        socketId: socket.id,
        timestamp: new Date().toISOString(),
        message: "Authentication successful",
      });
    });

    // Handle joining chat rooms
    socket.on("joinRoom", (roomId) => {
      socket.join(roomId);
      socket.currentRoomId = roomId; // Store current room ID for this socket

      console.log(`User ${socket.id} joined room: ${roomId}`);

      const roomSize = io.sockets.adapter.rooms.get(roomId)?.size || 0;
      console.log(`Room ${roomId} has ${roomSize} users`);

      // Notify user they successfully joined
      socket.emit("roomJoined", {
        roomId: roomId,
        message: "Successfully joined the room",
        usersInRoom: roomSize,
      });

      // Notify others in the room that a new user joined
      socket.to(roomId).emit("userJoinedRoom", {
        message: "Another user has joined the room",
        usersInRoom: roomSize,
        userId: socket.userId,
      });

      // If room has 2 users, notify both that they can start chatting
      if (roomSize === 2) {
        io.to(roomId).emit("roomReady", {
          roomId: roomId,
          message: "Both users are connected. You can now start chatting!",
          usersInRoom: roomSize,
        });
      }
    });

    socket.on("sendMessage", (data) => {
      console.log(
        `Message from ${socket.id} in room ${data.roomId}:`,
        data.text
      );

      // Broadcast to all users in the room except the sender
      socket.to(data.roomId).emit("receiveMessage", data);
    });

    socket.on("findMatch", async (userData) => {
      console.log("Backend now finding Match for ", userData);

      const oppositeRole =
        userData.role === "support-seeker" ? "listener" : "support-seeker";

      let categories;
      if (typeof userData.cat === "string") {
        categories = JSON.parse(userData.cat);
      } else {
        categories = userData.cat;
      }

      try {
        // First, let's check what's in the database
        console.log("Checking database for available users...");
        const { rows: allUsers } = await db.query(
          `SELECT id, name, categories, role, is_available FROM users`
        );
        console.log("All users in database:", allUsers);

        // Check if current user is in database and set them as available
        if (userData.user) {
          await db.query(
            `UPDATE users SET is_available = true, last_active = NOW() WHERE name = $1`,
            [userData.user]
          );
        }

        const { rows: potentialMatches } = await db.query(
          `
          SELECT id, name, categories, role
          FROM users
          WHERE role = $1
          AND categories && $2::INTEGER[]
          AND is_available = true
          AND name != $3
          ORDER BY last_active DESC
          LIMIT 5
          `,
          [oppositeRole, categories, userData.user]
        );

        console.log(
          `Looking for role: ${oppositeRole}, categories: ${categories}`
        );
        console.log("Potential matches found:", potentialMatches);

        // If no database matches, check the match queue for waiting users
        if (potentialMatches.length === 0) {
          console.log("No database matches, checking queue...");
          let queueMatch = null;

          for (const [queueUserId, queueUserData] of matchQueue.entries()) {
            const queueRole = queueUserData.userData.role;
            const queueCategories =
              typeof queueUserData.userData.cat === "string"
                ? JSON.parse(queueUserData.userData.cat)
                : queueUserData.userData.cat;

            console.log(
              `Checking queue user: ${queueUserId}, role: ${queueRole}, categories: ${queueCategories}`
            );

            // Check if roles are opposite and categories overlap
            if (
              queueRole === oppositeRole &&
              categories.some((cat) => queueCategories.includes(cat))
            ) {
              queueMatch = queueUserData;
              break;
            }
          }

          if (queueMatch) {
            console.log("Found match in queue!");

            // Create room and notify both users
            const roomId = generateRoomId();

            const matchDetails = {
              roomId: roomId,
              match: {
                name: queueMatch.userData.user,
                role: queueMatch.userData.role,
              },
              user: userData,
            };

            // Update both users' availability status (using name since id is null)
            if (userData.user && queueMatch.userData.user) {
              await db.query(
                `UPDATE users SET is_available = false WHERE name IN ($1, $2)`,
                [userData.user, queueMatch.userData.user]
              );
            }

            // Emit match found to current user
            socket.emit("matchFound", {
              ...matchDetails,
              matchedWith: queueMatch.userData,
            });

            // Emit match found to queued user
            queueMatch.socket.emit("matchFound", {
              ...matchDetails,
              matchedWith: userData,
            });

            // Remove both users from match queue
            matchQueue.delete(queueMatch.userData.user);
            matchQueue.delete(userData.user);

            console.log(
              `Match created between ${userData.user} and ${queueMatch.userData.user}`
            );
            return;
          }
        }

        if (potentialMatches.length > 0) {
          const match = potentialMatches[0];
          console.log("Database Match Found", match);

          // Create room and notify both users
          const roomId = generateRoomId();
          const matchDetails = {
            roomId: roomId,
            match: match,
            user: userData,
          };

          // Update both users' availability status (using name since id might be null)
          if (userData.user && match.name) {
            await db.query(
              `UPDATE users SET is_available = false WHERE name IN ($1, $2)`,
              [userData.user, match.name]
            );
          }

          // Emit match found to both users
          socket.emit("matchFound", {
            ...matchDetails,
            matchedWith: match,
          });

          // Find the matched user's socket and notify them
          const matchedUserSocket = [...io.sockets.sockets.values()].find(
            (s) => s.userId === match.name
          );

          if (matchedUserSocket) {
            matchedUserSocket.emit("matchFound", {
              ...matchDetails,
              matchedWith: userData,
            });
          }

          // Remove from match queue if they were waiting
          matchQueue.delete(userData.user);
          matchQueue.delete(match.name);
        } else {
          // No immediate match found, add to queue
          matchQueue.set(userData.user, {
            socket: socket,
            userData: userData,
            timestamp: Date.now(),
          });

          console.log(`No match found for ${userData.user}, added to queue`);
          console.log(`Current queue size: ${matchQueue.size}`);
          console.log(`Queue contents:`, Array.from(matchQueue.keys()));

          socket.emit("searchingForMatch", {
            message: "Looking for a match...",
          });
        }
      } catch (error) {
        console.error("Error finding match:", error);
        socket.emit("matchError", { error: "Failed to find match" });
      }
    });

    socket.on("acceptMatch", async (data) => {
      const { roomId, matchId } = data;

      // Join the match room
      socket.join(roomId);

      // Notify the other user that match was accepted
      socket.to(roomId).emit("matchAccepted", {
        roomId: roomId,
        message: "Match accepted! You can now start chatting.",
      });

      // Confirm to the accepting user
      socket.emit("matchAccepted", {
        roomId: roomId,
        message: "You've joined the chat room!",
      });
    });

    socket.on("declineMatch", async (data) => {
      const { matchId } = data;

      try {
        // Update availability status back to true for both users (using names)
        if (socket.userName && matchId) {
          await db.query(
            `UPDATE users SET is_available = true WHERE name IN ($1, $2)`,
            [socket.userName, matchId]
          );
        }

        // Notify the other user that match was declined
        const declinedUserSocket = [...io.sockets.sockets.values()].find(
          (s) => s.userName === matchId
        );

        if (declinedUserSocket) {
          declinedUserSocket.emit("matchDeclined", {
            message:
              "The other user declined the match. Looking for another match...",
          });
        }

        socket.emit("matchDeclined", {
          message: "Match declined. You can search for another match.",
        });
      } catch (error) {
        console.error("Error declining match:", error);
      }
    });

    socket.on("leaveRoom", async (roomId) => {
      socket.leave(roomId);
      socket.currentRoomId = null; // Clear current room

      // Get remaining users in room
      const remainingUsers = io.sockets.adapter.rooms.get(roomId)?.size || 0;

      // Notify remaining users
      socket.to(roomId).emit("userLeftRoom", {
        message: "The other user has left the conversation.",
        usersInRoom: remainingUsers,
      });

      console.log(
        `User ${socket.id} left room ${roomId}. Remaining users: ${remainingUsers}`
      );

      // Update user availability
      if (socket.userName) {
        try {
          await db.query(
            `UPDATE users SET is_available = true WHERE name = $1`,
            [socket.userName]
          );
        } catch (error) {
          console.error("Error updating availability:", error);
        }
      }
    });

    // Handle client disconnect with reason
    socket.on("disconnect", async (reason) => {
      console.log(`User disconnected: ${socket.id}, Reason: ${reason}`);
      console.log(`Remaining connections: ${io.engine.clientsCount}`);

      // Log disconnect reason for debugging
      const disconnectReasons = {
        "io server disconnect": "Server forced disconnect",
        "io client disconnect": "Client initiated disconnect",
        "ping timeout": "Connection timeout due to poor network",
        "transport close": "Transport connection lost",
        "transport error": "Transport error occurred",
      };

      console.log(`Disconnect reason: ${disconnectReasons[reason] || reason}`);

      // If user was in a room, notify others and clean up
      if (socket.currentRoomId) {
        const remainingUsers =
          io.sockets.adapter.rooms.get(socket.currentRoomId)?.size || 0;

        socket.to(socket.currentRoomId).emit("userLeftRoom", {
          message: "The other user has disconnected.",
          usersInRoom: remainingUsers,
          disconnected: true,
          disconnectReason: reason,
          timestamp: new Date().toISOString(),
        });

        console.log(
          `User ${socket.id} disconnected from room ${socket.currentRoomId}. Remaining users: ${remainingUsers}`
        );
      }

      // Remove from match queue
      if (socket.userName) {
        // Find and remove user from queue by socket or userData
        for (const [queueUserId, queueData] of matchQueue.entries()) {
          if (queueData.socket === socket || queueUserId === socket.userName) {
            matchQueue.delete(queueUserId);
            console.log(
              `Removed ${queueUserId} from match queue on disconnect`
            );
            break;
          }
        }

        // Update user availability status
        try {
          await db.query(
            `UPDATE users SET is_available = true, last_active = NOW() WHERE name = $1`,
            [socket.userName]
          );
        } catch (error) {
          console.error("Error updating user status on disconnect:", error);
        }
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
