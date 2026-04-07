const API_BASE_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:8081"
    : `http://${window.location.hostname}:8081`;

export default API_BASE_URL;
