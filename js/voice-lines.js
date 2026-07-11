// Gems of Light — voice-lines.js
// Every English line the garden says OUT LOUD, in one place.
// The files are generated once with ElevenLabs (tools/generate-narration.mjs)
// into audio/voice/<id>.mp3 and cached like recitations. If a file is missing
// the game stays silent — there is no robot voice, ever.
//
// Story pages narrate themselves too: their ids are story-<slug>-<page>,
// with the text taken straight from GOL_DATA (see storyVoiceId below).
(function () {
  const GOL = (window.GOL = window.GOL || {});

  GOL.VOICE_LINES = {
    // the echo moment
    'ui-your-turn': 'Your turn — say it out loud!',

    // the listening gate
    'ui-gate-veiled': 'The gems have veiled themselves in light. Listen to each one, and set them in the order of the surah.',

    // star walk
    'ui-star-walk': 'A star walk! Gather the gems in the order of the surah. Come close to a gem, and it will whisper its ayah.',
    'ui-not-yet': 'Not yet — listen for the ayah that comes first.',

    // moon trial
    'ui-trial-next': 'Which gem holds the ayah that comes next?',
    'ui-find-1': 'Which gem holds ayah one?',
    'ui-find-2': 'Which gem holds ayah two?',
    'ui-find-3': 'Which gem holds ayah three?',
    'ui-find-4': 'Which gem holds ayah four?',
    'ui-find-5': 'Which gem holds ayah five?',
    'ui-find-6': 'Which gem holds ayah six?',
    'ui-find-7': 'Which gem holds ayah seven?',
    'ui-praise': 'Beautiful! You knew it by heart.',
    'ui-moon-grows': 'The moon remembers with you — and it only ever grows.',

    // meaning match
    'ui-meanings': 'Listen to a gem, then carry it to what it means.',

    // the hidden treasure
    'ui-blossom': 'You found a hidden Rahma blossom!'
  };

  // A story page's narration id (text comes from the surah data itself).
  GOL.storyVoiceId = function (slug, page) { return 'story-' + slug + '-' + page; };
})();
