import { defineStore } from 'pinia';
import type { Track, Mood } from '../types/index.ts';
import api from '../services/api.ts';
import apiPublic from '../services/apiPublic.ts';

export const usePlayerStore = defineStore('player', {
  state: () => ({
    playlist: [] as Track[],
    currentTrackIndex: -1,
    isPlaying: false,
    isPlaylistLoading: false,
    isMoodsLoading: false,
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

    async ensureMoodsAvailable() {
       console.log(`PLAYER_STORE: ensureMoodsAvailable() called. Moods count: ${this.availableMoods.length}, Is loading: ${this.isMoodsLoading}`);
      if (this.availableMoods.length > 0 || this.isMoodsLoading) 
        {
          console.log('PLAYER_STORE: -> Skipping fetch, moods already exist or are loading.');
          return;
        }
      await this.fetchAvailableMoods();
    },
    
    async fetchAvailableMoods() {
      console.log('PLAYER_STORE: fetchAvailableMoods() - ACTION STARTED.');
      if (this.isMoodsLoading) {
        console.log('PLAYER_STORE: -> SKIPPING, fetch already in progress.');
        return
      };

      this.isMoodsLoading = true; 
      try {
         console.log('PLAYER_STORE: --> Making API call with apiPublic.get("/moods")');
        const response = await apiPublic.get('/moods');
         console.log('PLAYER_STORE: --> API call SUCCEEDED. Response:', response.data);
      
        this.availableMoods = response.data.data;
      } catch (error) {
        console.error('PLAYER_STORE: --> CATCH BLOCK! API call FAILED.', error);
        
        console.error('Error al obtener la lista de moods:', error);
        this.availableMoods = []; 
      } finally {
        this.isMoodsLoading = false; 
          console.log(`PLAYER_STORE: fetchAvailableMoods() - ACTION FINISHED. Final moods count: ${this.availableMoods.length}`);
     
      }
    },
    

    
    async fetchAndPlayPlaylist(moodId: number) {
      if (this.isPlaylistLoading) return;

      this.isPlaylistLoading = true;
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
          return;
        }

        this.playlist = playableTracks;
        this.currentTrackIndex = 0;
        this.isPlaying = true;

      } catch (error) {
        console.error('Error al obtener la playlist:', error);
      } finally {
        this.isPlaylistLoading = false; 
      }
    },

    async fetchMoreTracks() {
      if (this.isPlaylistLoading || this.currentMoodId === null) return;
      this.isPlaylistLoading = true;
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
        this.isPlaylistLoading = false;
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
      if (remainingTracks < 3 && !this.isPlaylistLoading) {
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

    reset() 
    {
    console.log('PLAYER_STORE: reset() called');
    this.playlist = [];
    this.currentTrackIndex = -1;
    this.isPlaying = false;
    this.currentMoodId = null;
    this.isPlaylistVisible = false;
    this.availableMoods = []; 
    this.isPlaylistLoading = false;
    this.isMoodsLoading = false;
    console.log('PLAYER_STORE: State has been completely reset.');
    },

    togglePlayPause() {
      if (!this.currentTrack) return;
      this.isPlaying = !this.isPlaying;
    },
  },
});
