#!/usr/bin/env node
// -*- coding: utf-8, tab-width: 2 -*-

import loGet from 'lodash.get';
import loSet from 'lodash.set';
import mustBe from 'typechecks-pmb/must-be.js';


import bot from './src/index.mjs';

const EX = {

  async cliMain() {
    await bot.run({
      config: EX.configureBot,
    });
  },

  async configureBot(botRun) {
    const cfg = botRun.config;
    const cliArgs = process.argv.slice(2);
    cliArgs.forEach(function readArg(arg) {
      if (arg.startsWith('{') && arg.endsWith('}')) {
        return cfg.script.push(JSON.parse(arg));
      }
      const splat = arg.split(/^([\w\.\-]+)=/);
      const key = mustBe.nest('Key part of CLI argument ' + arg, splat[1]);
      const old = loGet(cfg, key);
      if (old === undefined) {
        throw new Error('Unsuported config key ' + key);
      }
      let val = splat[2] || '';
      if (Array.isArray(old)) { return old.push(val); }
      const ot = typeof old;
      if (ot === 'number') { val = mustBe('fin num', +val); }
      loSet(cfg, key, val);
    });
  },


};

EX.autoStartTimer = setTimeout(EX.cliMain, 1);

export default EX;
