// -*- coding: utf-8, tab-width: 2 -*-

const EX = {

  oneLineJson(x) { return JSON.stringify(x, null, 2).replace(/\n */g, ' '); },

};


// Object.assign(EX, {});
export default EX;
