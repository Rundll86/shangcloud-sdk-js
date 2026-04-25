'use strict';

class UserBasicInfo {
  /**
   * @param {object} data
   * @param {number} data.uid
   * @param {string} data.nickname
   * @param {string} data.mail
   * @param {string} data.avatar
   */
  constructor({ uid, nickname, mail, avatar }) {
    this.userId = uid;
    this.nickname = nickname;
    this.mail = mail;
    this.avatar = avatar;
  }
}

module.exports = { UserBasicInfo };
