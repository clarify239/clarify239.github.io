// ============================================================
//  Claire's settings. Edit this file, no coding needed.
//  Put images in the assets/ folder and write their path, e.g. 'assets/crochet.jpg'
// ============================================================
window.SITE_CONFIG = {
  links: {
    resume: 'resume.pdf',          // drop your resume PDF next to index.html
    github: 'https://github.com/', // your GitHub profile
  },

  // Photos shown in the house dialogs (leave '' to show the pixel item instead)
  photos: {
    about: '',     // e.g. 'assets/me.jpg'
    bake: '',
    crochet: '',
    cats: '',
    fish: '',
    music: '',     // album art (replaced automatically when Last.fm is set up)
    games: '',     // game art (replaced automatically when Steam is set up)
  },

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
