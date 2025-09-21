import axios from 'axios';

const API_URL = '/api'; // Use proxy instead of direct URL

interface body {
    linha_id: number;
    is_fresh: boolean;
}

export const postData = async (data: body) => {
    try {
        const response = await axios.post(`${API_URL}/atividades`, data);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const postMessage = async (message: string) => {
    try {
        const response = await axios.post(`${API_URL}/chat/message`, { message });
        console.log(response);
        return response.data.data.response;
    } catch (error) {
        throw error;
    }
}