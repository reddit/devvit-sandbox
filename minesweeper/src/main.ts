// Visit developers.reddit.com/docs to learn Devvit!

import { Devvit } from '@devvit/public-api';
import { Minesweeper } from './components/Minesweeper.js';
import { Preview } from './components/Preview.js';

Devvit.configure({
  redditAPI: true,
});

Devvit.addCustomPostType({
  name: 'Minesweeper',
  render: Minesweeper,
});

Devvit.addMenuItem({
  label: 'Create Minesweeper Post',
  description: 'Creates a minesweeper custom post game',
  location: 'subreddit',
  onPress: async (_, { reddit, ui }) => {
    const sub = await reddit.getCurrentSubreddit();
    await reddit.submitPost({
      title: 'Minesweeper',
      subredditName: sub.name,
      preview: Preview(),
    });

    ui.showToast('Post created!');
  },
});

export default Devvit;
