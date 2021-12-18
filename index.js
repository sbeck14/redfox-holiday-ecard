const asyncPool = require('tiny-async-pool');
const fs = require('fs');
const config = require('./config.json');
const prettyMs = require('pretty-ms');

const gmailSend = require('./mailer.js')({
  user: config.user,
  pass: config.pass,
  from: config.from,
  subject: config.subject,
});

const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

const getTimestamp = () => {
  const d = new Date();
  return `${d.getMonth()}_${d.getDate()}_${d.getFullYear()}-${d.getHours()}_${d.getMinutes()}`;
}

const success = [];
const failed = [];

const emailBody = fs.readFileSync('./email.html').toString();

const colors = {
  green: '\u001b[32m',
  red: '\u001b[31m',
  reset: '\u001b[0m',
};

const emails = fs.readFileSync('emails.txt', 'utf-8').split('\n');

async function sendEmail(to) {
  try {
    await gmailSend.send({ to, html: emailBody });
    success.push(to);
    console.log(`${colors.green}✓${colors.reset}  ${to}`);
  } catch (err) {
    failed.push(to);
    console.log(`${colors.red}✗${colors.reset}  ${to}\n\t${err}`);
  }
  await snooze(3000)
}

async function doWork() {
  try {
    console.log(`Sending ${emails.length} emails...`);
    
    const start = new Date().getTime();
    const ts = getTimestamp();
    
    await asyncPool(2, emails, sendEmail);

    const end = new Date().getTime();
    const duration = end - start;

    const resultPayload = {
      time: ts,
      duration: prettyMs(duration),
      completed: success,
      failed: failed,
    };
    fs.writeFileSync(`results-${ts}.json`, JSON.stringify(resultPayload, null, 2));

    gmailSend.transport.close();

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