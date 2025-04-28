import { defineStore } from 'pinia';
import { io } from 'socket.io-client';

export const useSocketStore = defineStore('socket', {
  state: () => ({
    socket: null,
    isConnected: false,
  }),

  actions: {
    async init() {
      if (this.socket) return;

      this.socket = io('http://localhost:5001', {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        console.log('Socket connected');
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
        console.log('Socket disconnected');
      });

      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    },

    async emit(event, data) {
      if (!this.socket || !this.isConnected) {
        throw new Error('Socket not connected');
      }

      return new Promise((resolve, reject) => {
        this.socket.emit(event, data, (response) => {
          if (response.error) {
            reject(response.error);
          } else {
            resolve(response);
          }
        });
      });
    },

    on(event, callback) {
      if (!this.socket) return;
      this.socket.on(event, callback);
    },

    off(event, callback) {
      if (!this.socket) return;
      this.socket.off(event, callback);
    },

    disconnect() {
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
        this.isConnected = false;
      }
    },
  },
});
