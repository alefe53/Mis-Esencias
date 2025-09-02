import { defineStore } from 'pinia'
import type { Track } from '../types/index.ts'
import api from '../services/api.ts'
import { getPlayableUrl } from '../services/trackService'

export const usePlayerStore = defineStore('player', {
  state: () => ({
    playlist: [] as Track[],
    currentTrackIndex: -1,
    isPlaying: false,
    isPlaylistLoading: false,
    currentMoodId: null as number | null,
    isPlaylistVisible: false,
    playerState: 'maximized' as 'maximized' | 'docked' | 'hidden',
    isMobile: false,
  }),

  getters: {
    currentTrack(state): Track | null {
      if (
        state.currentTrackIndex >= 0 &&
        state.playlist[state.currentTrackIndex]
      ) {
        return state.playlist[state.currentTrackIndex]
      }
      return null
    },
    hasNext(state): boolean {
      return state.currentTrackIndex < state.playlist.length - 1
    },
  },

  actions: {
    setMobileStatus(isMobile: boolean) {
      this.isMobile = isMobile
    },
    async playAlbum(tracks: Track[]) {
      if (!tracks || tracks.length === 0) {
        console.error('Se intentó reproducir un álbum sin tracks.')
        return
      }
      const firstTrack = tracks[0]
      if (!firstTrack.playableUrl) {
        firstTrack.playableUrl = await getPlayableUrl(
          firstTrack.filePath,
          firstTrack.required_subscription_tier_id || null,
        )
      }
      if (!firstTrack.playableUrl) {
        alert('No se pudo obtener la URL para el primer track del álbum.')
        return
      }
      this.playlist = tracks
      this.currentTrackIndex = 0
      this.isPlaying = true
      this.currentMoodId = 5
    },

    async playTrackNow(track: Track) {
      if (!track.playableUrl) {
        track.playableUrl = await getPlayableUrl(
          track.filePath,
          track.required_subscription_tier_id || null,
        )
      }
      if (!track.playableUrl) {
        console.error(
          'No se pudo obtener una URL válida para el track:',
          track.title,
        )
        return
      }
      const existingIndex = this.playlist.findIndex((t) => t.id === track.id)
      if (existingIndex > -1) {
        this.playlist.splice(existingIndex, 1)
      }
      this.playlist.unshift(track)
      this.currentTrackIndex = 0
      if (track.moods && track.moods.length > 0) {
        const randomMoodIndex = Math.floor(Math.random() * track.moods.length)
        this.currentMoodId = track.moods[randomMoodIndex].id
      } else {
        this.currentMoodId = 5
      }
      this.isPlaying = true
    },

    async addToQueue(track: Track) {
      if (!track.playableUrl) {
        track.playableUrl = await getPlayableUrl(
          track.filePath,
          track.required_subscription_tier_id || null,
        )
      }
      if (!track.playableUrl) {
        console.error(
          'No se pudo obtener URL para agregar a la cola:',
          track.title,
        )
        return
      }

      if (this.currentTrackIndex === -1) {
        this.playlist.push(track)
        this.currentTrackIndex = this.playlist.length - 1
        this.isPlaying = true
      } else {
        this.playlist.splice(this.currentTrackIndex + 1, 0, track)
      }
    },

    async fetchAndPlayPlaylist(moodId: number) {
      if (this.isPlaylistLoading) return
      this.isPlaylistLoading = true
      this.currentMoodId = moodId
      try {
        const response = await api.get('/playlists', {
          params: { moodId, limit: 15 },
        })
        const playableTracks: Track[] = response.data.data.filter(
          (track: Track) => track.playableUrl,
        )
        if (playableTracks.length === 0) {
          console.error(
            'No se encontraron canciones reproducibles para este mood.',
          )
          this.playlist = []
          this.currentTrackIndex = -1
          this.isPlaying = false
          return
        }
        this.playlist = playableTracks
        this.currentTrackIndex = 0
        this.isPlaying = true
      } catch (error) {
        console.error('Error al obtener la playlist:', error)
      } finally {
        this.isPlaylistLoading = false
      }
    },

    async fetchMoreTracks() {
      if (this.isPlaylistLoading || this.currentMoodId === null) return
      this.isPlaylistLoading = true
      try {
        const excludeTrackIds = this.playlist.map((track) => track.id).join(',')
        const response = await api.get('/playlists', {
          params: {
            moodId: this.currentMoodId,
            limit: 5,
            excludeTrackIds,
          },
        })
        const newPlayableTracks = response.data.data.filter(
          (track: Track) => track.playableUrl,
        )
        this.playlist.push(...newPlayableTracks)
      } catch (error) {
        console.error('Error al obtener más canciones:', error)
      } finally {
        this.isPlaylistLoading = false
      }
    },

    togglePlaylistVisibility() {
      this.isPlaylistVisible = !this.isPlaylistVisible
    },

    playTrackFromPlaylist(index: number) {
      if (index >= 0 && index < this.playlist.length) {
        this.currentTrackIndex = index
        if (!this.isPlaying) {
          this.isPlaying = true
        }
      }
    },

    playNext() {
      const remainingTracks = this.playlist.length - 1 - this.currentTrackIndex
      if (remainingTracks < 3 && !this.isPlaylistLoading) {
        this.fetchMoreTracks()
      }
      if (this.hasNext) {
        this.currentTrackIndex++
        this.isPlaying = true
      } else {
        this.isPlaying = false
      }
    },

    playPrevious() {
      if (this.currentTrackIndex > 0) {
        this.currentTrackIndex--
        this.isPlaying = true
      }
    },

    reset() {
      this.playlist = []
      this.currentTrackIndex = -1
      this.isPlaying = false
      this.currentMoodId = null
      this.isPlaylistVisible = false
      this.isPlaylistLoading = false
      this.playerState = 'maximized'
    },

    togglePlayPause() {
      if (!this.currentTrack) return
      this.isPlaying = !this.isPlaying
    },

    minimizePlayer() {
      if (this.isMobile) {
        if (this.playerState === 'maximized') {
          this.playerState = 'hidden'
        }
      } else {
        if (this.playerState === 'maximized') {
          this.playerState = 'docked'
        } else if (this.playerState === 'docked') {
          this.playerState = 'hidden'
        }
      }
    },

    maximizePlayer() {
      if (this.isMobile) {
        if (this.playerState === 'hidden') {
          this.playerState = 'maximized'
        }
      } else {
        if (this.playerState === 'hidden') {
          this.playerState = 'docked'
        } else if (this.playerState === 'docked') {
          this.playerState = 'maximized'
        }
      }
    },
  },
})
