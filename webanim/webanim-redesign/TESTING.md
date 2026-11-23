# Testing Skyward Express

From the standalone game directory:

```sh
npm run build
npm test
python3 -m http.server 8731 --bind 127.0.0.1
```

Open `http://127.0.0.1:8731/`. The build checks JavaScript module syntax. The browser serves the original static files and needs no bundler or backend.

## Automated checks

- Fixed-step timing, frame-gap clipping, invalid transitions and independently released keyboard and pointer inputs.
- Movement, diagonal normalization, braking, boost depletion and recovery, battery drain and collision protection.
- Swept parcel hit detection, landing bands, fragile cargo, streak scoring, count-in, pause, reset, and failure conditions.
- A deterministic input pilot completes each of the 50 contracts on Standard with the Swift X1. This establishes playable paths and checks the charging routes. It does not measure difficulty for human pilots.
- Minimum career payouts, unlock sequence, upgrade limits, reward idempotence, best star retention, achievements, migration, serialization, validation and reset.

## Interactive regression

1. Start a career, open First Drop, select a loadout and launch. Press Space above the bakery, fly right and release over the café. Verify results, stars and rewards.
2. In Rooftop Mail, descend and cross the pole near the second half of the first leg. Check hull damage, then pause and restart.
3. In Precision Challenge, miss five drops. Verify the failure reason, retry and menu controls.
4. Buy the first Motor upgrade in the garage. Confirm speed increases from 260 to 278. Reload and verify career, save data and remaining credits.
5. Start Classic and Endless from the main menu. Verify flight, drop, pause, resume and menu return. Check that Endless hides the Classic score goal.
6. Check free flight’s touch controls in portrait and landscape. Confirm the browser does not scroll while flying. Try switching windows during a countdown and during a package drop.
7. Change a control mapping, test it in flight, and restore it. Try save export, import and reset with a disposable browser profile.
