// -*- coding: utf-8, tab-width: 2 -*-

import containsAll from 'string-or-buffer-contains-all-in-order-pmb';
import getOwn from 'getown';
import loMapValues from 'lodash.mapvalues';

import allCmd from './allCommandsNamespace.mjs';
import kisi from './kitchenSink.mjs';


const EX = {

  getDefaultConfig: () => ({

    scanNamePattern: '', /*
      If non-empty, scan mailbox names list for this search pattern,
      where `%` acts as wildcard.
      */

    fetchBatchSize: 100,

    defaultMailboxName: 'INBOX',

  }),


  summarizeMailboxMeta(box) {
    const summ = {};
    loMapValues({
      path: 0,
      highestModseq: 0,
      nTotal: 'exists',
      nUnseen: 'unseen',
      uidValidity: 0,
    }, function convertForJson(destKey, srcKey) {
      let val = getOwn(box, srcKey);
      if (val === undefined) { return; }
      if (val === null) { return; }
      const t = typeof val;
      if (t === 'bigint') { val = String(val); }
      summ[destKey || srcKey] = val;
    });
    return kisi.oneLineJson(summ);
  },


  async maybeScanNames(botRun) {
    const { scanNamePattern } = botRun.config.mailboxes;
    const patternParts = scanNamePattern?.split?.('%');
    if (!patternParts) { return; }
    const scanOpt = {
      messages: true,
      uidNext: true,
      uidValidity: true,
      unseen: true,
      highestModseq: true,
    };
    console.log('D:', 'scan mailboxes list:',
      kisi.oneLineJson({ pattern: scanNamePattern }));
    const boxes = await botRun.client.list(scanOpt);
    console.log('D:', 'found these mailboxes: [{ "n":', boxes.length, '}');
    boxes.forEach(function show(box) {
      const m = containsAll(box.path, patternParts, { anchored: 'both' });
      if (m) { console.log(',', EX.summarizeMailboxMeta(box)); }
    });
    console.log(']');
  },


};


Object.assign(allCmd, {

  async closeMailbox(botRun) {
    await botRun.currentMailboxLock?.release?.();
    botRun.currentMailboxLock = null; // eslint-disable-line no-param-reassign
  },


  async openDefaultMailbox(botRun) {
    await allCmd.closeMailbox(botRun);
    const name = botRun.config.mailboxes.defaultMailboxName;
    await botRun.cmd({ cmd: 'openMailboxByName', name });
  },


  async openMailboxByName(botRun, popCmdOpt) {
    await allCmd.closeMailbox(botRun);
    const name = popCmdOpt('nonEmpty str', 'name');
    const lock = await botRun.client.getMailboxLock(name);
    botRun.currentMailboxLock = lock; // eslint-disable-line no-param-reassign
    const box = botRun.client.mailbox;
    console.debug('D:', 'Got mailbox lock on', EX.summarizeMailboxMeta(box));
  },


});


export default EX;
