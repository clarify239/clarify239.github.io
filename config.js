// ============================================================
//  Claire's settings. Edit this file, no coding needed.
//  Put images in the assets/ folder and write their path, e.g. 'assets/crochet.jpg'
// ============================================================
window.SITE_CONFIG = {
  links: {
    resume: 'resume.pdf',          // drop your resume PDF next to index.html
    github: 'https://github.com/', // your GitHub profile
  },

  // Photos shown in the house dialogs. Each hobby takes a LIST of photos.
  // With two or more, arrows appear on top of the photo so people can flip through them.
  // Leave a list empty ([]) to show the pixel item and an "add your photos" note instead.
  photos: {
    about:   '',   // one photo, e.g. 'assets/me.jpg'
    bake:    [],   // e.g. ['assets/bake1.jpg', 'assets/bake2.jpg', 'assets/bake3.jpg']
    crochet: [],
    cats:    [],
    tv:      [],
    camping: [],
    fish:    [],
    music:   [],   // extra photos. Album art (set up Last.fm below) is added first, automatically.
    games:   [],   // extra photos. Game art (set up Steam below) is added first, automatically.
  },

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
