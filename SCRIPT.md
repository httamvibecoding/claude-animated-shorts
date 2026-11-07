# The Rope That Saved a Giant Monument

Draft v1 — based on the user's supplied script; historical details need source review before recording.

## Facts and Sources

- The Vatican obelisk was erected in St. Peter's Square in 1586 under Pope Sixtus V, with Domenico Fontana directing the work. Fontana published a contemporary account: [*Della transportatione dell'obelisco Vaticano e delle fabriche di Sisto V* (Rome, 1590)](https://purl.pt/6256/1/index.html).
- A secondary summary of Fontana's work reports an obelisk weighing about 320 tons and a crew of 800 men and 160 horses. The script uses the supported weight and crew count; it omits the horses because they are not part of this narration. Source: [Domenico Fontana](https://en.wikipedia.org/wiki/Domenico_Fontana).
- The exact number of ropes is not verified here, so the narration says "thick ropes" without a count.
- The sailor's shout to wet the ropes, the exact death-penalty rule, and the claimed rope-shrinkage rescue are widely repeated parts of the story, but were not verified in the contemporary source during this pass. Treat them as a later tradition unless a primary citation is found.

## Script
He screamed "Wet the ropes!" when speaking meant death, right as a stone tower weighing three hundred and twenty tons was about to snap them in half.

You see, the Pope is moving a giant Egyptian obelisk into the center of Rome. Eight hundred men are pulling on thick ropes, and to keep everyone focused, the Pope makes one terrifying rule. Speak a single word, and the hangman gets you on the spot.

For hours, the crowd is dead silent. Then, inches before the stone stands upright, the ropes stretch too far. The tower stops moving, the hemp starts smoking, and it's about to crash down.

Suddenly, an old sailor in the back screams, "Throw water on the ropes!" The guards grab him by the neck, laughing. "Great idea, sailor, let's make the ropes slippery so it crushes us faster."

Wait, what?

Well, the architect looks at the smoking ropes and tells his crew to dump barrels of water over every single one. You see, rope is made of twisted plant fibers. When those dry fibers drink up water, they swell sideways. And when a twisted rope puffs out sideways, it has to pull itself shorter lengthwise. As the water soaked in, the ropes shrank by inches, dragging three hundred and twenty tons of stone straight into place.

## Draft Shot Plan

Timing follows the generated 63.53-second voice at 30 fps (1,906 frames). Word events are in `video-project/public/words.json`; visual reactions should land 0-3 frames before their spoken word. Avoid showing a precise rope count; the narration uses the reported crew count of 800 men.

| Shot | Frames | Narration beat | Picture and camera |
|---|---:|---|---|
| 1 | 0-194 | Hook: "Wet the ropes!" | Start tight on a rope under load; reveal the obelisk hanging above the crew. Ease toward the sailor as the shout lands. |
| 2 | 194-320 | Pope, obelisk, Rome | Glide from the obelisk down to the worksite at St. Peter's Square; establish 1586 through architecture and costume, not a title card. |
| 3 | 320-580 | Men, ropes, terrifying rule | Track along the hauling line to the Pope and silent guards. Use the crowd's stillness to sell the rule; no written signs. |
| 4 | 580-657 | "For hours... dead silent" | Slow side glide across exhausted workers and taut ropes; keep small continuous movement during the hold. |
| 5 | 657-774 | Ropes stretch, stone stalls | Tilt up with the rising obelisk, then let its motion stop. Push toward the strained hemp as smoke begins. |
| 6 | 774-894 | Tower stalls, hemp smokes | Hold the stopped stone above the crew; creep toward smoke curling off the taut rope. |
| 7 | 894-1014 | Sailor calls for water | Reveal the older sailor at the back, then push into his shout; let the rope and obelisk remain visible behind him. |
| 8 | 1014-1089 | Guards seize him | Follow the guards through the crowd into a compact two-shot; their mockery plays deadpan, not broad slapstick. |
| 9 | 1089-1212 | "Great idea, sailor..." | Keep the sailor and guard in frame; land the joke with a small, dry push-in. |
| 10 | 1212-1419 | "Wait, what?" / water order | Punch in on the architect's reaction, then follow his gesture as barrels tip toward the ropes. |
| 11 | 1419-1738 | Rope-fiber explanation | Move from the wet full rope into a legible macro view of fibers swelling and the twist drawing shorter; no labels. |
| 12 | 1738-1906 | Stone pulled into place | Pull back as the shortened ropes take the load and the obelisk reaches vertical; end on the crew's relief. |

Production constraints: 1080x1920, 30 fps; original 2D characters in a painted 3D environment; English narration; no captions or labels. Use an original march-style score under the voice, with rope strain, creak, shouted line, barrel splash, and settling-stone effects. Lock picture timing before final sound mix.
