# rdp-cakedays

This app lets you host cakeday celebrations on your subreddit (your cakeday is the day your Reddit user account was created). Members of your community can opt in to the party and high-five each other on their cakedays.

The Cakeday app uses a custom post, scheduler, and the Key Value store to add users and track celebrations. The app has simple pagination, responsive buttons, and a basic social feature that facilitates fun interaction in your community.

# Using Cakedays

1. Install the [cakedays app](https://developers.reddit.com/apps/rdp-cakedays) on a subreddit you moderate
2. On your subreddit, you’ll see three moderator menu actions:
   1. **_New Cakeday post_**: creates a new cakeday post.
   2. **_Add Cakeday test data_**: adds fake data to your cakeday Key Value store for testing purposes.
   3. **_Clear Cakeday KVStore_**: deletes all data from your cakeday Key Value store.
3. Use “New Cakeday post" to create a new post. This post lets redditors select the “Add Me” button to opt into the celebration (it’s a good idea to pin it at the top of your feed).
4. Go to [sh.reddit.com/r/***_yoursubredditname_***|http://sh.reddit.com/r/***_yoursubredditname_***]. You’ll see a post similar to this:
   ![Cakedays](Cakedays.gif "Cakedays")

# Note

- Users must opt into sharing their Cakeday by pressing the "Add me" button
- See the [Cakedays github repo](https://github.com/reddit/devvit-sandbox/tree/main/devvit-0.10.x/rdp-cakedays-main) to fork and customize!
