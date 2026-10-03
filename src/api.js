const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function clientLogin(email, password) {
  const response = await fetch(`${API_BASE_URL}/api/client/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Login failed");
  }

  return data;
}

export async function getClientProfile(token) {
  const response = await fetch(`${API_BASE_URL}/api/client/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to load client profile");
  }

  return data;
}

export async function getClientUsers(token) {
  const response = await fetch(`${API_BASE_URL}/api/client/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to load users");
  }

  return data;
}

export async function updateClientUserStatus(token, userId, isActive) {
  const response = await fetch(
    `${API_BASE_URL}/api/client/users/${userId}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isActive }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to update user status");
  }

  return data;
}

export async function getClientLoginLogs(token) {
  const response = await fetch(`${API_BASE_URL}/api/client/login-logs`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to load login logs");
  }

  return data;
}
export async function getClientLiveUsers(token) {
  const response = await fetch(`${API_BASE_URL}/api/client/live-users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to load live users");
  }

  return data;
}

export async function getClientAds(token) {
  const response = await fetch(`${API_BASE_URL}/api/client/ads`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to load advertisements");
  }

  return data;
}

export async function createClientAd(token, adData) {
  const response = await fetch(`${API_BASE_URL}/api/client/ads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(adData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to create advertisement");
  }

  return data;
}

export async function updateClientAd(token, adId, adData) {
  const response = await fetch(`${API_BASE_URL}/api/client/ads/${adId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(adData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to update advertisement");
  }

  return data;
}

export async function deleteClientAd(token, adId) {
  const response = await fetch(`${API_BASE_URL}/api/client/ads/${adId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to delete advertisement");
  }

  return data;
}
export async function uploadClientAdMedia(token, file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/client/media/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to upload advertisement media");
  }

  return data;
}