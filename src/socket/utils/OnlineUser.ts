
type OnlineUsersMap = Map<string, Set<string>>; // userId -> socketIds

// ----------------- IN-MEMORY STORAGE ------------
const onlineUsers: OnlineUsersMap = new Map();

// ------------ ADD USER ONLINE ------------
export const addUserOnline = (userId: string, socketId: string): void => {
  // Add to onlineUsers map
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  onlineUsers.get(userId)!.add(socketId);

};

// ------------ REMOVE USER OFFLINE ------------
export const removeUserOffline = (
  userId: string,
  socketId: string
): boolean => {
  // Remove from onlineUsers
  const userSockets = onlineUsers.get(userId);
  if (userSockets) {
    userSockets.delete(socketId);

    // If no more sockets, remove user completely
    if (userSockets.size === 0) {
      onlineUsers.delete(userId);
    }
  }

  // Return true if user is completely offline
  return !onlineUsers.has(userId);
};