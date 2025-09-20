import axios from 'axios';

const API_URL = 'http://192.168.1.127:3001'; // Replace with your API URL

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