'use strict';

class UserInstance {
  constructor() {
    this._accessToken = '';
    this._refreshToken = '';
    this._tokenType = '';
    this.expiresIn = 0;
    this.expiryTime = new Date();
    this._client = null;
  }

  /**
   * @param {string} accessToken
   * @param {string} refreshToken
   * @param {string} tokenType
   * @param {number} expiresIn
   * @param {import('./client').Client} client
   */
  initUser(accessToken, refreshToken, tokenType, expiresIn, client) {
    this._accessToken = accessToken;
    this._refreshToken = refreshToken;
    this._tokenType = tokenType;
    this.expiresIn = expiresIn;
    this._client = client;
    this.expiryTime = new Date(Date.now() + expiresIn * 1000);
    this.save();
  }

  save() {}

  isExpired() {
    return new Date(Date.now() + 60_000) > this.expiryTime;
  }

  async getBasicInfo() {
    return this._client._getUserBasicInfo(this._accessToken, this._tokenType);
  }
}

module.exports = { UserInstance };
