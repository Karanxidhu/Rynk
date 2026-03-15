import { API_BASE_URL as ENV_API_BASE_URL } from "@env"

let currentApiBaseUrl: string = ENV_API_BASE_URL

export function getApiBaseUrl(): string {
  return currentApiBaseUrl
}

export function setApiBaseUrl(nextUrl: string) {
  currentApiBaseUrl = nextUrl.trim() || ENV_API_BASE_URL
}

