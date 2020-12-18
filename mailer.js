/**
 * Created by alykoshin on 8/12/14.
 */

'use strict';

const _ = require('lodash');
const nodemailer = require('nodemailer');

/**
 * sendOptions - options for nodemailer
 *
 * @typedef {Object} sendOptions
 * @property {string} options.user
 * @property {string} options.pass
 * @property {(string || string[])} options.files
 * @property {string} options.from
 * @property {string} options.to
 * @property {string} options.replyTo
 * @property {string} options.text
 * @property {string} options.html
 * @property {string} options.attachments - array of `nodemailer`s compatible attachments definitions
 */
/**
 * @callback sendCallback
 * @param {Object} error
 * @param {string} result
 * @param {Object} fullResult
 */
/**
 * @constructor
 * @param {sendOptions} options  - options for underlying nodemailer
 * @type {Function}
 */
const GMailSend = function(options) {
  const self = this;

  /** @member {string} */
  self.options = options;;

  self.transport = nodemailer.createTransport({
    service: 'Gmail', 
    auth: { 
      user: options.user,
      pass: options.pass 
    },
    pool: true,
  });

  /** helper to build 'Some Name <some.name@domain.com>' **/
  function prepareAddress(name, address) {
    return name + ' ' + '<' + address + '>';
  }

  function _send(options, callback) {
    const handleSuccess = (info) => {
      if (callback) {
        callback(null, info.response, info);
      }
    };

    const handleError = (error) => {
      if (typeof error === 'string') error = new Error(error);
      if (callback) {
        callback(error, error.message, undefined);
      }
    };

    options.from = options.from || options.user;

    // from

    options.from = prepareAddress(options.from, options.from); // adjust to nodemailer format

    // to
    options.to = prepareAddress(options.to, options.to);   // adjust to nodemailer format

    // Sending email

    return self.transport.sendMail(options, function (error, info) {
      if (error) {
        return handleError(error);
      } else {
        return handleSuccess(info);
      }
    });

  }


  /**
   * Send email
   *
   * You may use almost any option available in Nodemailer,
   * but if you need fine tuning I'd recommend to consider using Nodemailer directly.
   *
   * @param {sendOptions}  [options]  - options for underlying nodemailer
   * @param {sendCallback} [callback]
   * @return Promise({{ result: string, full: object }})
   */
  self.send = function(options) {
    options = options || {};
    options = _.extend({}, self.options, options);
    if (!options.user || !options.pass) { throw new Error('options.user and options.pass are mandatory.'); }
    return new Promise((resolve, reject) =>
      _send(options, (error, result, full) => error ? reject(error) : resolve({ result, full }))
    );
  };

  return self;
};

//

/**
 * Exporting function to send email
 *
 * @param {sendOptions} options  - options for new GMailSend()
 * @returns {function}
 */
module.exports = function(options) {
  return new GMailSend(options);
};
