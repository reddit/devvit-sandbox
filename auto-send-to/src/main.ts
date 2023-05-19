import { Metadata } from '@devvit/protos';
import { Devvit, getSetting } from '@devvit/public-api';

Devvit.use(Devvit.Types.HTTP);

const settingOptions: any = [
  {
    type: 'select',
    name: 'listenerObject',
    label: 'Objects to Send On',
    options: [
      { label: 'Posts', value: 'posts' },
      { label: 'Comments', value: 'comments' },
      { label: 'Posts and Comments', value: 'both' },
    ],
  },
  {
    type: 'string',
    name: 'webhook',
    label: 'Webhook URL',
  },
];

Devvit.addSettings(settingOptions);

Devvit.addTrigger({
  events: [Devvit.Trigger.PostSubmit, Devvit.Trigger.CommentSubmit],
  handler: sendContentToWebhook,
});
async function sendContentToWebhook(event: Devvit.MultiTriggerEvent, metadata?: Metadata) {
  const webhook = await getSetting('webhook', metadata) as string
  const listenerObject = await getSetting('listenerObject', metadata) as string

  if (!webhook) {
    throw new Error('No webhook URL provided');
  }

  if (
    (listenerObject === 'posts' && event.type === Devvit.Trigger.CommentSubmit) ||
    (listenerObject === 'comments' && event.type === Devvit.Trigger.PostSubmit)
  ) {
    return;
  }

  const msg = event.type === Devvit.Trigger.PostSubmit || event.type === Devvit.Trigger.CommentSubmit
    ? `New ${event.type.split('Submit')[0].toLowerCase()} submitted from ${event.event?.author?.name ?? ''}:\nUrl: https://www.reddit.com${event.event?.post?.url ?? ''}`
    : '';

  let payload = {};

  if (webhook.startsWith('https://hooks.slack.com/')) {
    payload = { text: msg };
  } else if (webhook.startsWith('https://discord.com/api/webhooks/')) {
    payload = { content: msg };
  } else {
    throw new Error('This webhook is neither from Slack nor Discord.');
  }

  const response = await fetch(webhook, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Error sending data to webhook');
  }
}

export default Devvit;
