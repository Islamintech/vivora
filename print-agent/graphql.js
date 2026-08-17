'use strict';

async function gqlRequest(apiUrl, query, variables, token) {
  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${apiUrl}`);
  }
  const body = await res.json();
  if (body.errors?.length) {
    throw new Error(body.errors.map((e) => e.message).join('; '));
  }
  return body.data;
}

async function login(apiUrl, email, password) {
  const data = await gqlRequest(
    apiUrl,
    `mutation Login($input: LoginInput!) {
      login(input: $input) { token user { _id restaurantId role } }
    }`,
    { input: { email, password } },
  );
  return data.login;
}

async function getMyRestaurant(apiUrl, token) {
  const data = await gqlRequest(
    apiUrl,
    `query MyRestaurant {
      myRestaurant {
        _id name currency printerEnabled printerIp printerPort
      }
    }`,
    {},
    token,
  );
  return data.myRestaurant;
}

module.exports = { login, getMyRestaurant };
