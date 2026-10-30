// -*- coding: utf-8, tab-width: 2 -*-

import loMapValues from 'lodash.mapvalues';

import login from './login.mjs';
import mailboxes from './mailboxes.mjs';


const EX = function getDefaultConfig() {
  const cfg = {
    script: [],
  };
  loMapValues({
    login,
    mailboxes,
  }, function save(v, k) { cfg[k] = v.getDefaultConfig(); });
  return cfg;
};


export default EX;
