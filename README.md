# Ink-Wash Koi Pond

A top-down koi pond painted in the style of Japanese ink-wash (sumi-e), built with three.js.

- Washi paper, ink-dotted stone banks, a stone lantern, calligraphy and seasonal seals.
- Four seasons: cherry blossoms (spring), lotus and dragonflies (summer), red maples and red dragonflies (autumn), bare plum branches under snow (winter). Flowers and leaves fall in the wind, float on the water for a while, sink, and grow back.
- Day and night for every season: a moonlit pond, a flickering stone lantern (dim under snow in winter), fireflies and frogs croaking on lotus leaves.
- Random wind gusts that sway the grass, the trees and everything floating on the water.
- Simulated water surface: move the mouse to stir it; ripples are drawn like ink strokes.
- 3D koi animated in a vertex shader: the body follows its swimming path, single-beat turns and C-start escapes based on koi kinematics research, fanning pectoral and pelvic fins, and patterns picked at random by the rarity of 13 varieties.
- Click to drop food: the koi rise to the surface to eat.

Keys: `1`–`4` season · `N` day/night · `A` auto · `M` mute · `I` info.

## Run

```bash
npm install
npm run dev
```

## Credits

- Koi model: ["Koi Fish"](https://sketchfab.com/3d-models/koi-fish-236859b809984f52b70c94fd040b9c59) by 7PLUS, licensed under [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/). The mesh is deformed and recolored in shaders.
- Music: two koto tracks from [Pixabay](https://pixabay.com/music/search/koto/) (Pixabay Content License), re-encoded at 128 kbps.
- Frog model: ["Frog"](https://sketchfab.com/3d-models/frog-436deb1555fa42b9bc146e1b6b0d1ebc) by Thunk3D scanner (Diana123456), licensed under [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/). Decimated, re-oriented and repainted with ink-wash vertex colors.
