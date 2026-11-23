# Balancing

Implementation values live in `game/balance.js`, `game/contracts.js` and `game/career.js`.

- The Swift X1 starts at 260 units/s, 645 thrust, 100 hull, 100 battery and payload capacity 3. Boost raises the speed ceiling to 1.6×, uses 50 boost points per second, and regenerates 20 per second. Release the Boost key after depletion to rearm.
- Battery drains by 0.47 units/s at idle, with an additional 0.29 while moving and 1.9 while boosting. A depot adds 42 units/s to a drone hovering slowly in the bay. Impact protection lasts 1.05 seconds.
- Parcel gravity starts at 680 units/s². A drop inherits 65% of horizontal speed and 30% of vertical speed, with cargo-specific gravity. The perfect band occupies the central 28% of a valid target, and Good extends to 68%. Fragile cargo is damaged in the outer band.
- Perfect, Good and Acceptable score 150, 100 and 60. The second consecutive delivery reaches 2× and the fourth reaches 3×. A miss, damaged parcel or impact resets the combo.
- Casual uses 124% target width, 128% campaign time and 67% collision damage. Expert uses 83% target width, 88% campaign time and 142% collision damage. Standard uses 100%.
- The first contract pays a base ₱140 and 90 XP, with ₱45 and 28 XP per newly earned bonus star before the difficulty multiplier. Replays can collect an unearned star bonus once. The Standard completion score also includes time, remaining hull and stars.
- A garage upgrade has three levels. First-level prices range from ₱115 to ₱145. Higher levels cost the base price times the square of the new level and unlock at career levels 4 and 7.
- The XP threshold for level L is `135*(L-1) + 5*(L-1)^2`. Districts require levels 1, 4, 7, 10 and 13 plus completion of the previous district’s main route. The fixtures verify that one-star Casual payouts can unlock all 40 main routes in order.
