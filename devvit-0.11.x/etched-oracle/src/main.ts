import {Devvit, OnTriggerEvent, RichTextBuilder, SettingsFormField} from '@devvit/public-api';
import { PostSubmit, CommentSubmit } from '@devvit/protos';
import Context = Devvit.Context;

Devvit.configure({
  redditAPI: true,
  kvStore: true,
  http: true,
  media: true,
});

//region Utility functions
const getCardKey = (card: string): string => {
  const simplifiedCardName = card
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9]/g, '');
  return `card-${simplifiedCardName}`;
}

function makeLink(text: string, url: string): string {
  return `[${text}](${url})`;
}

function makeCardTextUrl(card: CardObject): string {
  return `https://api.scryfall.com/cards/${card.id}?utm_source=etched-oracle&format=text`;
}
//endregion

//region Settings
const SettingsFields = Object.freeze({
  showCardImageIfSingleCard: {
    name: 'showCardImageIfSingleCard',
    type: 'boolean',
    defaultValue: true,
    label: 'Show card image if only one card is found',
  }
} satisfies Record<string, SettingsFormField>);
Devvit.addSettings(Object.values(SettingsFields));
//endregion

//region Card object
type CardObject = {
  "object": "card",
  "id": string,
  "name": string,
  "uri": string,
  "scryfall_uri": string,
  "image_uris": {
    "small": string,
    "normal": string,
    "large": string,
    "png": string,
    "art_crop": string,
    "border_crop": string,
  },
  "mana_cost": string,
  "cmc": number,
  "type_line": string,
  "oracle_text": string,
  "flavor_text": string,
  "related_uris":{
    "gatherer": string,
    "tcgplayer_infinite_articles": string,
    "tcgplayer_infinite_decks": string,
    "edhrec": string,
  },
  "purchase_uris":{
    "tcgplayer": string,
    "cardmarket": string,
    "cardhoarder": string,
  },
};
const CARD_FIELDS = [
  'object',
  'id',
  'name',
  'uri',
  'scryfall_uri',
  'image_uris',
  'mana_cost',
  'cmc',
  'type_line',
  'oracle_text',
  'flavor_text',
  'related_uris',
  'purchase_uris'
];
function simplifyCardData(card: Object): CardObject {
  return Object.keys(card).reduce(function(limitedCard, key) {
    if (CARD_FIELDS.includes(key)) {
      // @ts-ignore - we're just copying the fields we want, the types will match, promise
      limitedCard[key] = card[key];
    }
    return limitedCard;
  }, {}) as CardObject;
}
//endregion

//region Card Info & Triggers
const CARD_FINDER_REGEX = /\\?\[\\?\[([^\]]+?)\\?]\\?]/g;
const CARD_LOOKUP_URL = 'https://api.scryfall.com/cards/named';
const getCardLookupUrl = (card: string): string => `${CARD_LOOKUP_URL}?fuzzy=${encodeURIComponent(card)}`;

async function onEvent(
    event: OnTriggerEvent<PostSubmit | CommentSubmit>,
    context: Devvit.Context
): Promise<void> {
  let bodyText: string;
  let id: string;
  let authorId: string;
  if(event.type === 'PostSubmit') {
    const post = (event as OnTriggerEvent<PostSubmit>).post!;
    bodyText = post.selftext;
    id = post.id;
    authorId = post.authorId;
  } else {
    const comment = (event as OnTriggerEvent<CommentSubmit>).comment!;
    bodyText = comment.body;
    id = comment.id;
    authorId = comment.author;
  }

  const myUser = await context.reddit.getUserById(context.appAccountId);

  if(authorId === myUser.id) {
    console.log('Ignoring my own post/comment');
    return;
  }

  const cards = findCardsInMessage(bodyText);

  const showCardImageIfSingleCard = await context.settings.get<boolean>(SettingsFields.showCardImageIfSingleCard.name) ?? SettingsFields.showCardImageIfSingleCard.defaultValue;

  if(cards.length > 1 || (cards.length === 1 && !showCardImageIfSingleCard)) {
    const cardObjects: (CardObject | string)[] = await Promise.all(cards.map((card) => getCardInfo(card, context)));

    try {
      await context.reddit.submitComment({
        id,
        text: cardObjects.map(renderCardLinks).join('\n\n'),
      });
    } catch (e) {
      console.error(e);
    }
  } else if(cards.length === 1) {
    const card = await getCardInfo(cards[0], context);
    if(typeof card === 'string') {
      try {
        await context.reddit.submitComment({
          id,
          text: card,
        });
      } catch (e) {
        console.error(e);
      }
    } else {
      try {
        await context.reddit.submitComment({
          id,
          richtext: await renderCardAsRichText(card, context),
        });
      } catch (e) {
        console.error(e);
      }
    }
  }
}

function findCardsInMessage(msg: string): string[] {
  const matches = msg.matchAll(CARD_FINDER_REGEX);
  const cards: string[] = [];
  for (const match of matches) {
    cards.push(match[1]);
  }

  if(cards.length > 0) {
    console.log(`Found cards: ${cards.join(', ')}`);
  }

  return cards;
}

async function getCardInfo(cardName: string, context: Context): Promise<CardObject | string> {
  let card: CardObject | undefined = await context.kvStore.get(getCardKey(cardName));
  if (card) {
    console.log(`Found card "${cardName}" in cache`);
  } else {
    // Fetch from scryfall API using a fuzzy match & cache the response
    try {
      console.log(`Fetching card "${cardName}" from scryfall`);
      const cardResp = await fetch(getCardLookupUrl(cardName));
      card = simplifyCardData(await cardResp.json());
      console.log(`Got it!`);
      await context.kvStore.put(getCardKey(cardName), card);
    } catch (e) {
      console.error(e);
    }
  }
  if (!card) {
    return `Could not find card: "${cardName}"`;
  }

  return card;
}

function renderCardLinks(card: CardObject | string): string {
  if(typeof card === 'string') {
    return card;
  }
  return `${
    makeLink(card.name, card.scryfall_uri)
  } - ${
    makeLink('(G)', card.related_uris.gatherer)
  } ${
    makeLink('(SF)', card.scryfall_uri)
  } ${
    makeLink('(EDH)', card.related_uris.edhrec)
  } ${
    makeLink('(txt)', makeCardTextUrl(card))
  }`;
}

async function renderCardAsRichText(card: CardObject | string, context: Context): Promise<RichTextBuilder> {
  if(typeof card === 'string') {
    return new RichTextBuilder().paragraph((p) => p.text({text: card}));
  }

  const {mediaId} = await context.media.upload({
    url: card.image_uris.normal,
    type: 'image',
  });

  const builder = new RichTextBuilder();
  builder.image({mediaId});
  builder.paragraph((p) => {
    return p
        .link({text: card.name, url: card.scryfall_uri})
        .text({text: ' - '})
        .link({text: '(G)', url: card.related_uris.gatherer})
        .text({text: ' '})
        .link({text: '(SF)', url: card.scryfall_uri})
        .text({text: ' '})
        .link({text: '(EDH)', url: card.related_uris.edhrec})
        .text({text: ' '})
        .link({text: '(txt)', url: makeCardTextUrl(card)})
  });
  return builder;
}

Devvit.addTrigger({
  event: 'PostSubmit',
  onEvent
});

Devvit.addTrigger({
  event: 'CommentSubmit',
  onEvent
});
//endregion

export default Devvit;
