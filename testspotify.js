const SpotifyWebApi = require('spotify-web-api-node')
const SpotifyTrackStream = require('spotify-track-stream')

var spotifyApi = new SpotifyWebApi({
  clientId: 'fadb46549190416c91f719de6d2cc0b9',
  clientSecret: 'cda8a104780f45d5a3bb26f892cfbfe6'
})

spotifyApi.setAccessToken(
  'BQCXH52zk9jdZDntPr03bihaLwS-ekbcZkWIfoAo7n3slZdwEa_hBuMHO_HA2acitlZVXvr25gVM3byDUgok1MZorlaOOB_QsoHZ2qKCNERXxlB4pFUlF_LiFZO9rlSuOWDXKecYFMRNYUvi_a9zdtmR7Hwf7kJagorf8zwFV6wc_Przb3o_Rxm94LkUj7o1yV6LHT1PIy39Cm_hRUq8ORRj_xYaLi6ZPHWdiAWLfRgtGeaqU1J4kc5PAIxDqne63YgyKwAnZwJbLsfSN10bN3p6lo9-dp9EwGLx5PU'
)

spotifyApi.getPlaylist('5ieJqeLJjjI8iJWaxeBLuK', { limit: 1 }).then(
  function (data) {
    if (data.statusCode == 200) {
      var t = data.body.tracks.items[0]
      let tracks = new SpotifyTrackStream(t)
      console.log(tracks)
    }
  },
  function (err) {
    console.log('Something went wrong!', err)
  }
)
