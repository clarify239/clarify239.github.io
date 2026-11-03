// Cloudflare Worker: returns Claire's most recently played Steam game as JSON.
// Keeps the Steam API key secret and adds the CORS header the website needs.
//
// Setup (free): see README.md, section "Live Steam game".
// Needs two secrets on the worker: STEAM_KEY (your Steam Web API key) and STEAM_ID (your 64-bit Steam ID).

export default {
  async fetch(request, env) {
    const headers = {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
      'cache-control': 'public, max-age=900',
    };
    try {
      const url = 'https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/?count=1&key=' +
        encodeURIComponent(env.STEAM_KEY) + '&steamid=' + encodeURIComponent(env.STEAM_ID);
      const res = await fetch(url);
      const data = await res.json();
      const g = data && data.response && data.response.games && data.response.games[0];
      if (!g) return new Response(JSON.stringify({}), { headers });
      return new Response(JSON.stringify({
        name: g.name,
        hours: Math.round(g.playtime_forever / 60) + ' hrs on record',
        image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/' + g.appid + '/header.jpg',
      }), { headers });
    } catch (e) {
      return new Response(JSON.stringify({}), { headers, status: 200 });
    }
  },
};
