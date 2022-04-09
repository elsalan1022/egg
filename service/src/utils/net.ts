import Url from 'url';
import axios, { AxiosRequestConfig } from 'axios';

export const axiosInstance = axios.create({
  withCredentials: true,
});

export default {
  async request(options: AxiosRequestConfig, rspRaw?: boolean) {
    const headers = options.headers || (options.headers = {});
    if (!options.url) {
      throw 'invald url';
    }
    headers.host = (new Url.URL(options.url)).host;
    const rs = await axiosInstance.request(options);
    return rspRaw ? {
      data: rs.data,
      headers: rs.headers,
      status: rs.status,
      statusText: rs.statusText,
    } : rs.data;
  },
  async get(url: string, options?: AxiosRequestConfig) {
    options = options || {};
    const headers = options.headers || (options.headers = {});
    headers.host = (new Url.URL(url)).host;
    return (await axiosInstance.get(url, options)).data;
  },
  async post(url: string, data: any, options?: AxiosRequestConfig) {
    options = options || {};
    const headers = options.headers || (options.headers = {});
    headers.host = (new Url.URL(url)).host;
    return (await axiosInstance.post(url, data, options)).data;
  },
};
