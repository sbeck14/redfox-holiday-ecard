const asyncPool = require('tiny-async-pool');
const fs = require('fs');
const config = require('./config.json');

const htmlEmail = fs.readFileSync('./email.html').toString();

const send = require('gmail-send')({
  user: config.user,
  pass: config.pass,
  from: config.from,
  subject: config.subject,
});

const colors = {
  green: '\u001b[32m',
  red: '\u001b[31m',
  reset: '\u001b[0m',
};

const emails = require('fs').readFileSync('emails.txt', 'utf-8').split('\n');

async function sendEmail(email) {
  try {
    await send({
      'to': email,
      'html': htmlEmail,
    });
    console.log(`${colors.green}✓${colors.reset}  ${email}`);
  } catch (err) {
    console.log(`${colors.red}✗${colors.reset}  ${email}\n\t${err}`);
  }
}

async function doWork() {
  try {
    await asyncPool(2, emails, sendEmail);
  } catch (err) {
    console.log(err);
  }
}

console.log(`Sending ${emails.length} emails...`);
doWork();
