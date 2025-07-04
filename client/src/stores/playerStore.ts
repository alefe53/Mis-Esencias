import { defineStore } from 'pinia';
import type { Track, Mood } from '../types/index.ts';
import api from '../services/api.ts';

export const usePlayerStore = defineStore('player', {
  state: () => ({
    playlist: [] as Track[],
    currentTrackIndex: -1,
    isPlaying: false,
    isLoading: false,
    // Iniciamos sin un mood seleccionado para forzar la interacción del usuario
    currentMoodId: null as number | null, 
    availableMoods: [] as Mood[],
    isPlaylistVisible: false,
  }),

  getters: {
    currentTrack(state): Track | null {
      if (state.currentTrackIndex >= 0 && state.playlist[state.currentTrackIndex]) {
        return state.playlist[state.currentTrackIndex];
      }
      return null;
    },
    hasNext(state): boolean {
      return state.currentTrackIndex < state.playlist.length - 1;
    },
  },

  actions: {
    // Esta acción ahora se llamará explícitamente cuando el usuario abra la lista de moods
    async fetchAvailableMoods() {
      // Evita recargar si ya los tenemos
      if (this.availableMoods.length > 0) return; 
      
      this.isLoading = true;
      try {
        const response = await api.get('/moods');
        // Asumimos que tu endpoint de moods devuelve un array en `response.data.data`
        // Si devuelve directamente el array, cambia a: this.availableMoods = response.data;
        this.availableMoods = response.data.data;
      } catch (error) {
        console.error('Error al obtener la lista de moods:', error);
      } finally {
        this.isLoading = false;
      }
    },


    
    async fetchAndPlayPlaylist(moodId: number) {
      if (this.isLoading) return;
      this.isLoading = true;
      this.currentMoodId = moodId; 
      try {
        const response = await api.get('/playlists', {
          params: { moodId, limit: 15 },
        });

        const playableTracks: Track[] = response.data.data.filter(
          (track: Track) => track.playableUrl
        );

        if (playableTracks.length === 0) {
          console.error("No se encontraron canciones reproducibles para este mood.");
          this.playlist = [];
          this.currentTrackIndex = -1;
          this.isPlaying = false;
          // Aquí podrías mostrar una notificación al usuario
          return;
        }

        this.playlist = playableTracks;
        this.currentTrackIndex = 0;
        this.isPlaying = true;

      } catch (error) {
        console.error('Error al obtener la playlist:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async fetchMoreTracks() {
      if (this.isLoading || this.currentMoodId === null) return;
      this.isLoading = true;
      try {
        const excludeTrackIds = this.playlist.map(track => track.id).join(',');
        const response = await api.get('/playlists', {
          params: { 
            moodId: this.currentMoodId,
            limit: 5, 
            excludeTrackIds 
          },
        });

        const newPlayableTracks = response.data.data.filter(
          (track: Track) => track.playableUrl
        );
        this.playlist.push(...newPlayableTracks);
      } catch (error) {
        console.error('Error al obtener más canciones:', error);
      } finally {
        this.isLoading = false;
      }
    },

    togglePlaylistVisibility() {
      this.isPlaylistVisible = !this.isPlaylistVisible;
    },
    
    playTrackFromPlaylist(index: number) {
      if (index >= 0 && index < this.playlist.length) {
        this.currentTrackIndex = index;
        if (!this.isPlaying) {
            this.isPlaying = true;
        }
      }
    },

    playNext() {
      const remainingTracks = this.playlist.length - 1 - this.currentTrackIndex;
      if (remainingTracks < 3 && !this.isLoading) {
        this.fetchMoreTracks();
      }
      if (this.hasNext) {
        this.currentTrackIndex++;
        this.isPlaying = true;
      } else {
        this.isPlaying = false;
      }
    },

    playPrevious() {
      if (this.currentTrackIndex > 0) {
        this.currentTrackIndex--;
        this.isPlaying = true;
      }
    },

    togglePlayPause() {
      if (!this.currentTrack) return;
      this.isPlaying = !this.isPlaying;
    },
  },
});
