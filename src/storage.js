'use strict';

class TempVarStorage {
  setTempVariable(key, value) {
    throw new Error('Not implemented');
  }

  getTempVariable(key) {
    throw new Error('Not implemented');
  }

  deleteTempVariable(key) {
    throw new Error('Not implemented');
  }
}

class RamKv extends TempVarStorage {
  constructor() {
    super();
    this._storage = new Map();
  }

  setTempVariable(key, value) {
    this._storage.set(key, value);
  }

  getTempVariable(key) {
    if (!this._storage.has(key)) {
      throw new Error(`Key '${key}' not found`);
    }
    return this._storage.get(key);
  }

  deleteTempVariable(key) {
    this._storage.delete(key);
  }
}

module.exports = { TempVarStorage, RamKv };
