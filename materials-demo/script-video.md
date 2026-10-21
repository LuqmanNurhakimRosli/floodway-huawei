[07:45, 21/10/2026] luqman~: Video Scripts:
1. Nadi
"Every monsoon, the water arrives before the warning does. In 2024, floods cost Malaysia RM933.4 million, according to the Department of Statistics. We are FloodWay. We tell a neighbourhood it is in danger before the water reaches the door.

The gap is the last hour. Official rainfall and river data are strong at basin and district level. A township needs to know which road floods next, and when.

Our answer is one system with one clear warning, in four levels: Normal, Advisory, Warning and Danger."
[07:45, 21/10/2026] luqman~: 2. Luqman
"Here is how one warning is built. Three live factors feed it, and one trained model sits underneath as the base layer.

Factor one is the river node. It is our designed sensor. An ultrasonic sensor on a bridge railing points down at the water, and the node turns the distance into river height, corrected for air temperature. It sends a reading over LoRa radio every five minutes, and solar power keeps it running. It is a design, not a built unit.

Factor two is the street camera. It looks for the water line on the road, and it needs two readings before a level changes. Today it runs on sample frames, so we make no field accuracy claim.

Factor three is the forecast: MetMalaysia's open weather data, through the national data API. It says when heavy rain is coming, not which street.

The base layer is Model 1. It scores each part of the township from 0 to 100, using satellite bands, water indices and terrain. Low, Moderate or High.

Every number on the model slide comes from our  training report, and we show them as reported. The split was random by pixel, and neighbouring pixels look almost the same, so these scores are probably too high. We are re-testing on whole areas the model never saw. Our rainfall Random Forest reaches 74.55 per cent on a first split. It is a prototype.

Now the working prototype. Five sample cameras show level and trend, and this one has reached Warning.

A citizen report arrives with a photo, a description and a location. The vision check gives an opinion, and a person still reviews it.

The route avoids the flooded area and heads to a relief centre. Then the alert: a Telegram message from the backend."
[07:46, 21/10/2026] luqman~: 3. Aniq
"Official systems matter, and we build on them. JPS publishes river levels and flood bulletins a day or two ahead, at district and basin level. NADMA's MyDIMS shows evacuation centres and takes verified reports. Google Maps and Waze already route around reported flooding.

FloodWay fills a narrower gap: street-level timing from our own sensors and cameras, and routes that avoid the flood on the way to a shelter. That is a design claim until the pilot tests it.

It is feasible: the node uses off-the-shelf parts, and the parts estimate is RM558 to RM945 per node, before we test. It scales: a new township adds nodes and cameras, not a new system.

Our proposed pilot is Bandar Bukit Raja in Klang, subject to SDP's agreement. Next step: one township, with measured accuracy and measured lead time.

FloodWay: four levels, one clear message, before the water arrives. Thank you.

Data card, on screen for 6 s, after Aniq: Data and sources: MetMalaysia open data (data."