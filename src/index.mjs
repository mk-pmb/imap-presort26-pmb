// -*- coding: utf-8, tab-width: 2 -*-

// import readDataFile from 'read-data-file';

import getOwn from 'getown';
import mustBe from 'typechecks-pmb/must-be.js';
import objPop from 'objpop';
import vTry from 'vtry';

import allCmd from './allCommandsNamespace.mjs';
import getDefaultConfig from './cfg.defaults.mjs';
import login from './login.mjs';
import mailboxes from './mailboxes.mjs';


const EX = {

  async run(how) {
    const { config: origConfigOpt, ...botRun } = how;
    botRun.config = getDefaultConfig();
    botRun.client = false;
    botRun.failed = false;
    await origConfigOpt(botRun);
    try {
      botRun.client = await login.connect(botRun);
      console.log('D:', 'Connected, using bot config', botRun.config);
    } catch (errNoConnect) {
      botRun.failed = errNoConnect;
      console.error('E:', 'Connect failed:', errNoConnect,
        'using bot config', botRun.config);
      return botRun;
    }

    botRun.client.on('error', function onError(err) {
      console.error('E:', 'IMAP error:', err.code, err.message);
      botRun.failed = err;
    });

    botRun.client.on('close', function onClose() {
      if (botRun.expectingDisconnect) {
        console.log('D:', 'IMAP connection ended as expected.');
        return;
      }
      const msg = 'IMAP connection ended unexpectedly.';
      console.error('E:', msg);
      if (!botRun.failed) { botRun.failed = new Error(msg); }
    });

    botRun.cmd = EX.cmd.bind(null, botRun);
    try {
      await mailboxes.maybeScanNames(botRun);
      await botRun.cmd({ cmd: 'openDefaultMailbox' });
      await EX.runNextScriptStep(botRun);
    } finally {
      await allCmd.closeMailbox(botRun);
    }
    botRun.expectingDisconnect = true;
    await botRun.client.logout();
    delete botRun.expectingDisconnect;
    return botRun;
  },


  async runNextScriptStep(botRun) {
    return botRun;
  },


  async cmd(botRun, cmdSpec) {
    const { cmd: cmdName, ...cmdOpts } = cmdSpec;
    mustBe.nest('command name', cmdName);
    const impl = getOwn(allCmd, cmdName);
    if (!impl) { throw new Error('Unsupported script command: ' + cmdName); }
    const trace = ' script command ' + cmdName;
    mustBe.fun('Implementation for' + trace, impl);
    const popOpt = objPop(cmdOpts, { mustBe }).mustBe;
    await vTry.pr(impl, 'While running' + trace)(botRun, popOpt);
    popOpt.expectEmpty('command option(s) after execution (BUG!)');
  },


};


export default EX;
