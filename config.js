// ============================================================
//  Claire's settings. Edit this file, no coding needed.
//  Put images in the assets/ folder and write their path, e.g. 'assets/crochet.jpg'
// ============================================================
window.SITE_CONFIG = {
  links: {
    resume: 'resume.pdf',          // drop your resume PDF next to index.html
    github: 'https://github.com/clarify239', // your GitHub profile
  },

  // Photos shown in the house dialogs. Each hobby takes a LIST of photos.
  // With two or more, arrows appear on top of the photo so people can flip through them.
  // Leave a list empty ([]) to show the pixel item and an "add your photos" note instead.
  photos: {
    about:   'assets/me.png',   // one photo, e.g. 'assets/me.jpg'
    bake:    ['assets/baking1.png', 'assets/baking2.png', 'assets/baking3.png', 'assets/baking4.png', 'assets/baking5.png'],   // e.g. ['assets/bake1.jpg', 'assets/bake2.jpg', 'assets/bake3.jpg']
    crochet: ['assets/crochet1.png', 'assets/crochet2.png', 'assets/crochet3.png'],
    cats:    ['assets/astro1.png', 'assets/astro2.png', 'assets/astro3.png'],
    tv:      [],
    drinks:  ['assets/drinks1.png', 'assets/drinks2.png', 'assets/drinks3.png'],   // boba, matcha, barista photos
    camping: ["assets/camping1.jpg", "assets/camping2.jpg", "assets/camping3.png"],
    fish:    ["assets/fishing1.png", "assets/fishing2.png", "assets/fishing3.png"],
    music:   [],   // extra photos. Album art (set up Last.fm below) is added first, automatically.
    games:   [],   // extra photos. Game art (set up Steam below) is added first, automatically.
  },

  // The "Friends & fun stuff" carousel in the About section. Add as many as you like.
  // Each one is { src: 'assets/file.jpg', caption: 'Short caption', label: 'Ball text', story: 'A sentence or two' }
  // Only src is required. "label" is the word on the prize ball, and "story" shows on the sticky note by the memory wall.
  gallery: [
     { src: 'assets/friends1.png', caption: 'Hiking with friends!', label: 'Hiking' },
     { src: 'assets/friends2.png', caption: 'Halloween 2026!', label: 'Halloween' },
     { src: 'assets/friends3.png', caption: 'Women in Computing at Cornell Hangout!', label: 'WICC' },
     { src: 'assets/friends4.png', caption: 'My Chinese Student Association (CSA) Family', label: 'CSA' },
     { src: 'assets/friends5.jpg', caption: 'Going to PAX East via the Development in Games Association at Cornell!', label: 'PAX' },

  ],

  // What the TV in the house says you're watching
  watching: { title: 'Brooklyn Nine-Nine', note: 'A rewatch. Again. Nine-Nine!' },

  // Fill these in as the fallback "now playing" / "recently played" text
  nowPlaying: { song: '[Song title]', artist: '[Artist]' },
  recentGame: { name: 'Overwatch', hours: '346 hrs on record' },

  // Live Spotify via Last.fm (free): connect Spotify to Last.fm, then get an API key at
  // https://www.last.fm/api/account/create and fill in both values below.
  lastfm: { user: '', apiKey: '' },

  // Live Steam: deploy steam-worker.js (see README) and paste its URL here.
  steamWorkerUrl: '',

  // Project links and media for the fishing cards ('' hides a link / shows a placeholder)
  projects: {
    ai:      { link: '', github: '', media: '' },
    veil:    { link: '', github: '', media: '' },
    bracket: { link: '', github: '', media: '' },
    xr:      { link: '', github: '', media: '' },
    ops:     { link: '', github: '', media: '' },
    brew:    { link: '', github: '', media: '' },
  },
};
