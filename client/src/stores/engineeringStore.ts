import { defineStore } from 'pinia';
import apiPublic from '../services/apiPublic';
import type { EngineeringProjectSummary, EngineeringProjectDetails } from '../types';

export const useEngineeringStore = defineStore('engineering', {
  state: () => ({
    projects: [] as EngineeringProjectSummary[],
    currentProjectDetails: null as EngineeringProjectDetails | null,
    isLoadingProjects: false,
    isLoadingDetails: false,
  }),

  actions: {
    async fetchProjects() {
      if (this.projects.length > 0) return;
      this.isLoadingProjects = true;
      try {
        const response = await apiPublic.get('/engineering');
        this.projects = response.data.data;
      } catch (error) {
        console.error("Error al cargar los proyectos de ingeniería:", error);
      } finally {
        this.isLoadingProjects = false;
      }
    },

    async fetchProjectDetails(id: number) {
      this.isLoadingDetails = true;
      this.currentProjectDetails = null;
      try {
        const response = await apiPublic.get(`/engineering/${id}`);
        this.currentProjectDetails = response.data.data;
      } catch (error) {
        console.error(`Error al cargar detalles del proyecto ${id}:`, error);
      } finally {
        this.isLoadingDetails = false;
      }
    },
  },
});