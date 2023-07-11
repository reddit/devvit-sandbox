import { Devvit, OnTriggerEvent } from '@devvit/public-api';
import { ModAction } from '@devvit/protos';

Devvit.configure({
  redditAPI: true,
});

Devvit.addSettings([{
    type: "string",
    name: "logSubreddit",
    label: "Log Subreddit",
    onValidate: async (event, context) => {
      const invokerAccount = await context.reddit.getUserById(context.userId!);

      const invokerAccountMod = await context.reddit.getModerators({
        subredditName: event.value!,
        username: invokerAccount.username,
      }).all();

      if(invokerAccountMod.length !== 1) {
        return "You must moderate the target subreddit.";
      }
    }
  },
  {
    type: "boolean",
    name: "ignoreAutomod",
    label: "Ignore u/Automoderator",
  },
]);

Devvit.addTrigger({
  event: 'ModAction',
  onEvent: async (event: OnTriggerEvent<ModAction>, context: Devvit.Context) => {
    const targetSub = await context.settings.get<string>("logSubreddit");

    if(event.moderator!.name.toLowerCase() === 'automoderator' && await context.settings.get<boolean>("ignoreAutomod")) {
      return
    }

    const title = `u/${event.moderator!.name} performed action \`${event.action}\``;
    let output: string[] = [];

    if(event.targetUser) {
      output = output.concat(`Target User: u/${event.targetUser.name}`);
    }

    if(event.targetPost && event.targetPost.id !== ""){
      output = output.concat(`Title: ${event.targetPost.title}`);
      if(event.targetPost.isSelf) {
        output = output.concat(`Body: \n\n ________\n\n${event.targetPost.selftext}\n\n________`);
      }
      output = output.concat(`URL: ${event.targetPost.url}`);
    }

    if(event.targetComment && event.targetComment.id !== "") {
      output = output.concat(`Text:\n\n________\n\n${event.targetComment.body}\n\n________`)
    }
    
    await context.reddit.submitPost({
      title,
      subredditName: targetSub!,
      text: output.join("\n\n"),
    });
  }
});

export default Devvit;
