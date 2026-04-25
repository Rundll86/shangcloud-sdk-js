'use strict';

const https = require('https');
const http = require('http');
const crypto = require('crypto');
const { RamKv } = require('./storage');
const { UserInstance } = require('./user');
const { UserBasicInfo } = require('./models');

function generateRandomString(length) {
  return crypto.randomBytes(length).toString('base64').slice(0, length);
}

function httpRequest({ url, method, headers, body }) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const lib = urlObj.protocol === 'https:' ? https : http;
    const bodyBuffer = Buffer.from(body);

    const req = lib.request(
      {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method,
        headers: { ...headers, 'Content-Length': bodyBuffer.length },
        timeout: 10000,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(`Server returned error status: ${res.statusCode}, body: ${data}`));
            return;
          }
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse response: ${e.message}`));
          }
        });
      }
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });

    req.write(bodyBuffer);
    req.end();
  });
}

class Client {
  constructor(clientId, clientSecret, redirectUri) {
    this.clientId = clientId;
    this._clientSecret = clientSecret;
    this.redirectUri = redirectUri;
    this.scope = 'user:basic';
    this.baseUrl = 'https://api.yearnstudio.cn';
    this.kvStorage = new RamKv();
  }

  static initClient(clientId, clientSecret, redirectUri) {
    return new Client(clientId, clientSecret, redirectUri);
  }

  setClientSecret(clientSecret) {
    this._clientSecret = clientSecret;
  }

  _generateAuthorizeHeader() {
    return Buffer.from(`${this.clientId}:${this._clientSecret}`).toString('base64');
  }

  generateOAuthUrl() {
    const state = generateRandomString(10);
    this.kvStorage.setTempVariable(state, '0');
    const params = new URLSearchParams({
      response_type: 'code',
      state,
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scope,
    });
    return `${this.baseUrl}/oauth/authorize?${params.toString()}`;
  }

  async generateUserInstance(code, state) {
    try {
      this.kvStorage.getTempVariable(state);
    } catch {
      throw new Error(`State '${state}' not found or expired`);
    }
    this.kvStorage.deleteTempVariable(state);

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.redirectUri,
    }).toString();

    const tResp = await httpRequest({
      url: `${this.baseUrl}/oauth/token`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${this._generateAuthorizeHeader()}`,
      },
      body,
    });

    const user = new UserInstance();
    user.initUser(tResp.access_token, tResp.refresh_token, tResp.token_type, tResp.expires_in, this);
    return user;
  }

  async _getUserBasicInfo(accessToken, tokenType) {
    const data = await this._request('/api/user/info', {}, accessToken, tokenType);
    return new UserBasicInfo(data);
  }

  async _request(path, body, accessToken, tokenType) {
    return httpRequest({
      url: `${this.baseUrl}${path}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${tokenType} ${accessToken}`,
      },
      body: JSON.stringify(body),
    });
  }
}

module.exports = { Client };
