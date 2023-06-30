import timezones from 'timezones-list';
import {
    endOfYesterday,
    subWeeks,
    format,
    parse,
} from 'date-fns'
import {
    zonedTimeToUtc,
} from 'date-fns-tz'

import { Devvit, SettingsValues, Context, RichTextBuilder, Post } from '@devvit/public-api-next';

import {
    SCHEDULER_JOB_SETTINGS_CHECKER,
    KV_KEY_SETTINGS_CHECKER_JOB_ID,
    SCHEDULER_JOB_ROUNDUP_POST,
    KV_KEY_ROUNDUP_POSTS,
    KV_KEY_FREQUENCY,
    KV_KEY_ROUNDUP_POST_JOB_ID,
    TIME_PATTERN,
    SETTING_INCLUDE_MODERATOR_SELECTIONS,
    SETTING_TOP_POST_COUNT,
    DAY_DATE_FORMAT,
    SETTING_POST_TIME,
    SETTING_TIMEZONE,
    SETTING_TOP_COMMENTED_COUNT,
    SETTING_DAY_OF_WEEK,
    TIME_FORMAT
} from './constants.js'

type ThingWithScore<T> = {
    thing: T
    score: number
}

Devvit.configure({
    kvStore: true,
    redditAPI: true
})

//#region settings
Devvit.addSettings([
    {
        type: "string",
        name: "message",
        label: "A message to include with the roundup post (optional)"
    },
    {
        type: "select",
        name: SETTING_TIMEZONE,
        label: "Timezone",
        multiSelect: false,
        options: timezones.default.map(({label, tzCode}) => ({label, value: tzCode})),
        defaultValue: ["America/New_York"]
    },
    {
        type: "string",
        name: SETTING_POST_TIME,
        label: "Post Time (24h HH:MM)",
        defaultValue: "9:00",
        onValidate({value}) {
            if (!value) {
                return "Time is a required field"
            }

            if (!TIME_PATTERN.test(value)) {
                return "Time format must be HH:MM"
            }
        }
    },
    {
        type: "select",
        name: SETTING_DAY_OF_WEEK,
        label: "Day of Week",
        multiSelect: false,
        options: [
            "Sunday", 
            "Monday", 
            "Tuesday", 
            "Wednesday", 
            "Thursday", 
            "Friday", 
            "Saturday", 
            "Sunday"
        ].map((label, value) => ({label, value: value.toString()}))
    },
    {
        type: 'boolean',
        name: SETTING_INCLUDE_MODERATOR_SELECTIONS,
        label: 'include moderator selections',
        defaultValue: true
    },
    {
        type: 'number',
        name: SETTING_TOP_POST_COUNT,
        label: "How many top posts by votes to show (0 to disable section)?",
        defaultValue: 3,
        onValidate({value}) {
            if (value && value > 10) { return 'Can only display a maximum of 10' }
        }
    },
    {
        type: 'number',
        name: SETTING_TOP_COMMENTED_COUNT,
        label: "How many most commented posts to show (0 to disable section)?",
        defaultValue: 3,
        onValidate({value}) {
            if (value && value > 10) { return 'Can only display a maximum of 10' }
        }
    },
])
//#endregion


//#region scheduler

// Keeps an eye on settings and checks if our settings have impacted our schedule
Devvit.addSchedulerJob({
    name: SCHEDULER_JOB_SETTINGS_CHECKER,
    async onRun(_event, context) {
        console.log("checking if settings have changed")
        const settings = await context.settings.getAll()
        const cron = settingsToCron(settings)

        const current = await context.kvStore.get(KV_KEY_FREQUENCY) 

        if (cron !== current) {
            console.log(`schedule has changed; setting up new job. old: ${current} new: ${cron}`)
            await setupSchedulerJob(context, KV_KEY_ROUNDUP_POST_JOB_ID, SCHEDULER_JOB_ROUNDUP_POST, cron)
            await context.kvStore.put(KV_KEY_FREQUENCY, cron)
        } else {
            console.log("schedule has not changed")
        }
    }
})

Devvit.addSchedulerJob({
    name: SCHEDULER_JOB_ROUNDUP_POST,
    async onRun(_event, context) {
        console.log("posting roundup post")
        await postRoundup(context)
    }
})

//#endregion

//#region triggers
// When the app is installed or upgraded we want to make sure our
// settings watcher is ready to go
Devvit.addTrigger({    
    events: ["AppInstall", "AppUpgrade"],
    onEvent: async (_event, context) => { 
        let jobs = await context.scheduler.listJobs()
        await Promise.all(jobs.map(j => context.scheduler.cancelJob(j.id)))

        setupSchedulerJob(context, KV_KEY_SETTINGS_CHECKER_JOB_ID, SCHEDULER_JOB_SETTINGS_CHECKER, '*/1 * * * *')
    }
})
//#endregion


//#region menu items
Devvit.addMenuItem({
    label: 'Add to roundup',
    location: "post",
    forUserType: "moderator",
    async onPress(event, context) {
        const current = await context.kvStore.get<string[]>(KV_KEY_ROUNDUP_POSTS) || []
        const value = [...current, event.targetId]
        await context.kvStore.put(KV_KEY_ROUNDUP_POSTS, [...new Set(value)])
        const post = await context.reddit.getPostById(event.targetId)
        context.ui.showToast(`Added "${post.title}" to roundup!`)
    }
})

Devvit.addMenuItem({
    label: 'Remove from roundup',
    location: "post",
    forUserType: "moderator",
    async onPress(event, context) {
        const posts = await context.kvStore.get(KV_KEY_ROUNDUP_POSTS) as string[]
        if (!posts) {
            context.ui.showToast({
                text: 'post is not in roundup',
                appearance: 'neutral'
            });
            return
        }

        const updated = posts.filter(p => p !== event.targetId)
        await context.kvStore.put(KV_KEY_ROUNDUP_POSTS, updated)
        const post = await context.reddit.getPostById(event.targetId)
        context.ui.showToast(`Removed "${post.title}" from roundup!`);
    }
})

Devvit.addMenuItem({
    label: 'Post roundup now',
    location: "subreddit",
    forUserType: "moderator",
    async onPress(_event, context) {
        await postRoundup(context)
        context.ui.showToast("Roundup posted. Refresh page to see post");
    }
})

//#endregion

//#region helper functions
function settingsToCron(settings: SettingsValues): string {
    const time = parse(settings.postTime as string, TIME_FORMAT, new Date())
    const [tz] = settings[SETTING_TIMEZONE] as string[]

    const utcTime = zonedTimeToUtc(time, tz)

    return `${utcTime.getUTCMinutes()} ${utcTime.getUTCHours()} * * ${settings[SETTING_DAY_OF_WEEK]}`
}

async function setupSchedulerJob(context: Context, redisKey: string, jobName: string, cron: string) {
    const jobId = await context.kvStore.get(redisKey) as string

    if (jobId) {
        await context.scheduler.cancelJob(jobId)
    }

    const jobid = await context.scheduler.runJob({
        name: jobName,
        data: undefined,
        cron,
    })
    await context.kvStore.put(redisKey, jobid)
}

async function postRoundup(context: Context) {
    const subreddit = await context.reddit.getCurrentSubreddit()
    console.log(`posting roundup for ${subreddit.name}`)

    const settings = await context.settings.getAll()

    console.log(settings)
    const startTime = subWeeks(endOfYesterday(), 1)
    const endTime = endOfYesterday()
    const timeRange = `week of ${format(startTime, DAY_DATE_FORMAT)}-${format(endTime, DAY_DATE_FORMAT)}`

    // TODO: filter this to just the last week worth of posts
    let newPosts = await context.reddit.getNewPosts({
        subredditName: subreddit.name,
        limit: 1000,
        pageSize: 100,
    })

    const topPostsByUpvote: Array<ThingWithScore<Post>> = [];
    const topPostsByCommentCount: Array<ThingWithScore<Post>> = [];

    const topPostLimit = settings[SETTING_TOP_POST_COUNT] as number || 0;
    const topCommentLimit = settings[SETTING_TOP_COMMENTED_COUNT] as number || 0;

    let postCount = 0;
    let commentCount = 0;
    for await(const post of newPosts) {
        console.log(`processing post ${post.id}`)
        handleTopList(post, "score", topPostsByUpvote, topPostLimit)
        handleTopList(post, "numberOfComments", topPostsByCommentCount, topCommentLimit)
        postCount++;
        commentCount += post.numberOfComments;
    }

    const textBuilder = new RichTextBuilder()
    addPostSection(textBuilder, "Most Upvoted Posts", topPostsByUpvote.map(({thing}) => thing), ({title, score}) => `${title} (${score} 🡅)`)
    addPostSection(textBuilder, "Most Commented Posts", topPostsByCommentCount.map(({thing}) => thing), ({title, numberOfComments}) => `${title} (${numberOfComments} 💬)`)
    const postIds = await context.kvStore.get(KV_KEY_ROUNDUP_POSTS) as (string[] | undefined);
    if (postIds) {
        const posts = await Promise.all(postIds.map(pid => context.reddit.getPostById(pid)))
        addPostSection(textBuilder, "Moderator Selections", posts)
    }

    await context.reddit.submitPost({
        subredditName: subreddit.name,
        title: `weekly roundup for ${timeRange}`,
        richtext: textBuilder
    })

    // cleanup mod selections for next week
    await context.kvStore.delete(KV_KEY_ROUNDUP_POSTS)
}

function handleTopList<T>(thing: T, field: keyof T, arr: Array<ThingWithScore<T>>, limit: number) {
    const lowest = lowestScore(arr) ;
    const score = thing[field] as number;
    if (score >= lowest || arr.length < limit) {
        console.log("adding to list")
        arr.push({ thing, score })
        sortAndTrim(arr, limit)
    }
}

function lowestScore(arr: Array<ThingWithScore<any>>): number {
    return arr.at(-1)?.score ?? Number.MIN_VALUE
}

function sortAndTrim(arr: Array<ThingWithScore<any>>, limit: number) {
    arr.sort((a, b) => a.score < b.score ? 1 : -1)
    arr.length = limit
}


function addPostSection(textBuilder: RichTextBuilder, title: string, posts: Post[], onPost: (post: Post) => string = (p) => p.title ) {
    if (posts.length === 0) {
        return
    }
    textBuilder.heading({level: 3}, h => h.rawText(title))
    .list({ ordered: true }, (l) => {
        posts.forEach(post => {
            l.item(i => i.paragraph(p => p.link({ 
                text: onPost(post),
                url: post.permalink
            })))

        })
    });
}

//#endregion

export default Devvit;
