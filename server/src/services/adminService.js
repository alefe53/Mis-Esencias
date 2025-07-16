// RUTA: src/services/adminService.ts
import api from "./api";

export const getAdminChatDashboard = async () => {
	const { data } = await api.get("/chat/admin/dashboard");
	return data.data;
};
