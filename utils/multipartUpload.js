/** Axios options for React Native multipart uploads (avoids Network Error). */
export const multipartUploadConfig = {
  timeout: 120000,
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
  transformRequest: (data) => data,
};

export default multipartUploadConfig;
