const asyncPool = require('tiny-async-pool');
const fs = require('fs');
const config = require('./config.json');
const prettyMs = require('pretty-ms');

const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

const success = [];
const failed = [];

const emailBody = fs.readFileSync('./email.html').toString();

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

const emails = fs.readFileSync('emails.txt', 'utf-8').split('\n');

async function sendEmail(to) {
  await snooze(500)
  try {
    await send({ to, html: emailBody });
    success.push(to);
    console.log(`${colors.green}✓${colors.reset}  ${to}`);
  } catch (err) {
    failed.push(to);
    console.log(`${colors.red}✗${colors.reset}  ${to}\n\t${err}`);
  }
  await snooze(500)
}

async function doWork() {
  try {
    console.log(`Sending ${emails.length} emails...`);
    
    const start = new Date().getTime();
    
    await asyncPool(2, emails, sendEmail);

    const end = new Date().getTime();
    
    fs.writeFileSync('success.json', JSON.stringify(success, null, 2));
    fs.writeFileSync('failed.json', JSON.stringify(failed, null, 2));

    const duration = end - start;
    
    console.log(`Sent ${success.length} emails in ${prettyMs(duration)}`);
    
    if (failed.length > 0) {
      console.log(`${colors.red}There were ${colors.reset}${failed.length}${colors.red} emails that could not be sent.${colors.reset}`)
      console.log('Please see failed.json for a list of email addresses with errors.')
    }
  } catch (err) {
    console.log(err);
  }
}

doWork();