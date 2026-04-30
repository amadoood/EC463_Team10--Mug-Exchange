import { SERVER_URL } from "../constants/data";

export function loginRequest(username, password) {
  return fetch(`${SERVER_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
}

export function signupRequest(username, password, phone, displayName) {
  return fetch(`${SERVER_URL}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user: username, pass: password, phone_number: phone, display_name: displayName }),
  });
}

export function internalOrderRequest(body) {
  return fetch(`${SERVER_URL}/internal-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function verifyRequest(token) {
  return fetch(`${SERVER_URL}/verify`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function logoutRequest(token) {
  return fetch(`${SERVER_URL}/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}
