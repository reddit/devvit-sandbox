import { ConfigFieldType, Metadata, Severity, SubredditObject } from '@devvit/protos';
import { Context, Devvit } from '@devvit/public-api';
import { version } from "../package.json";

interface Heartbeat {
  metadata: Metadata | undefined,
  minutes: number,
  subreddit: SubredditObject,
  ticks: number
}

const scheduler = Devvit.use(Devvit.Types.Scheduler);
const log = Devvit.use(Devvit.Types.Logger);

Devvit.addAction({
  context: Context.SUBREDDIT,
  userInput: {
    fields: [
      {
        fieldType: ConfigFieldType.NUMBER,
        key: "minutes",
        prompt: "Please enter a schedule frequency in minutes. Eg, 5.",
        response: ""
      }
    ]
  },
  name: 'Schedule an endlessly recurring heartbeat.', // text to display in the menu (keep it short!)
  description: 'This is dangerous!', // short blurb describing what we're going to do
  handler: async (action, metadata) => {
    const minutes = JSON.parse(action.userInput?.fields[0].response as string)
    await schedule(minutes, action.subreddit, 0, metadata);
    return { success: true, message: `Scheduled for every ${minutes} minute(s).` };
  },
});

Devvit.SchedulerHandler.onHandleScheduledAction(async (action, metadata) => {
  const heartbeat: Heartbeat = action.data as Heartbeat
  await log.Log({
      message: `v${version} ${heartbeat.subreddit.name}: ${heartbeat.ticks.toString()}`,
      severity: Severity.VERBOSE,
      tags: ['scheduled', 'heartbeat'],
    },
    metadata
  );
  await schedule(
    heartbeat.minutes, heartbeat.subreddit, heartbeat.ticks + 1, metadata
  );
});

async function schedule(
  minutes: number,
  subreddit: SubredditObject,
  ticks: number,
  metadata: Metadata | undefined
): Promise<void> {
  const heartbeat: Heartbeat = {metadata, minutes, subreddit, ticks}
  await scheduler.Schedule({
    cron: undefined,
    when: new Date(Date.now() + minutes * 60 * 1000),
    action: {type: 'heartbeat', data: heartbeat}
  }, metadata);
}

export default Devvit;
