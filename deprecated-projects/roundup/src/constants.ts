// Scheduler jobs
export const SCHEDULER_JOB_SETTINGS_CHECKER = 'settings_checker';
export const SCHEDULER_JOB_ROUNDUP_POST = 'roundup_post'

// KVStore keys
export const KV_KEY_SETTINGS_CHECKER_JOB_ID = `scheduler:job:${SCHEDULER_JOB_SETTINGS_CHECKER}`
export const KV_KEY_ROUNDUP_POST_JOB_ID = `scheduler:job:${SCHEDULER_JOB_ROUNDUP_POST}`
export const KV_KEY_ROUNDUP_POSTS = 'roundup:posts'
export const KV_KEY_FREQUENCY = 'roundup:frequency'

// Settings
export const SETTING_POST_TIME = "postTime"
export const SETTING_TIMEZONE = "tz"
export const SETTING_DAY_OF_WEEK = "dayOfWeek"
export const SETTING_INCLUDE_MODERATOR_SELECTIONS = 'includeModeratorSelections';
export const SETTING_TOP_POST_COUNT = 'topPostCount';
export const SETTING_TOP_COMMENTED_COUNT = 'topCommentedCount';

// General
export const TIME_PATTERN = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/
export const DAY_DATE_FORMAT = "M/d"
export const TIME_FORMAT = "H:mm"