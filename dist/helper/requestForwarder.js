import axios from 'axios';
export const forwardRequest = async (config) => {
    return axios(config);
};
