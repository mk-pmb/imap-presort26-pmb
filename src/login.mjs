// -*- coding: utf-8, tab-width: 2 -*-

import { ImapFlow } from 'imapflow';
import getOwn from 'getown';
import isStr from 'is-string';
import mustBe from 'typechecks-pmb/must-be.js';
import objPop from 'objpop';
import retrievePassword from 'config-password-source-pmb';


const EX = {

  getDefaultConfig: () => ({
    host: 'mail.@',
    port: 'imaps',
    tls: 'startTLS', // or: 'SSL'
    user: 'example@example.net',
    pswd: 'file:/dev/null',
  }),


  namedPorts: {
    imap: { port: 143 },
    imap2: { port: 143 },
    imaps: { port: 993, tls: 'SSL' },
  },


  async toImapFlowOptions(origCfg) {
    const cfg = { ...origCfg };
    let { port } = cfg;
    if (isStr(port)) { Object.assign(cfg, getOwn(EX.namedPorts, port)); }
    const mustPop = objPop(cfg, { mustBe }).mustBe;
    const user = mustPop('nonEmpty str', 'user');
    let host = mustPop('nonEmpty str', 'host');
    port = mustPop('nonEmpty str | num pos | undef', 'port');
    const pswdSourceSpec = mustPop('nonEmpty str', 'pswd');

    const tlsOpts = (function configureCrypto() {
      const knownTlsModes = {
        startTLS: { secure: false, doSTARTTLS: true },
        SSL: { secure: true, doSTARTTLS: false },
      };
      const name = mustPop([['oneOf', Object.keys(knownTlsModes)]], 'tls');
      const opts = getOwn(knownTlsModes, name);
      if (!opts) { throw new Error('Unsupported TLS mode ' + name); }
      return opts;
    }());

    mustPop.expectEmpty('unsupported login option(s)');

    if (!(Number.isFinite(port) && (port >= 1))) {
      throw new Error('Invalid port number: ' + port);
    }

    const userAtHostPart = (user.split('@').slice(1).slice(-1)[0]) || '';
    host = host.replace(/@/g, userAtHostPart || '<empty>');
    if (host.includes('<') || host.includes('>')) {
      throw new Error('Invalid character in hostname: ' + host);
    }

    const ifo = { host, port, auth: { user }, ...tlsOpts };
    ifo.auth.pass = await retrievePassword(pswdSourceSpec);
    return ifo;
  },


  async connect(botRun) {
    const imapFlowOpt = {
      ...(await EX.toImapFlowOptions(botRun.config.login)),
      logger: false,
    };
    const client = new ImapFlow(imapFlowOpt);
    await client.connect();
    delete imapFlowOpt.auth.pass;
    return client;
  },


};


export default EX;
