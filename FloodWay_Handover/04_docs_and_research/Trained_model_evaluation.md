FloodWay prediction stack: trained model evaluation
Oct 20, 2026 · @rakuman
FloodWay's SDP prediction combines four inputs: a trained model, a river IoT sensor, the MetMalaysia forecast API and CCTV. The trained models carried over from GINKGO need re-testing before their numbers go on a slide, because the two published benchmark tables are identical.
Verdict
Use the four-input design and the model names on the slide tonight; hold back every GINKGO benchmark number until Nadi and Tisya re-run them on a spatially held-out test. The two GINKGO tables match digit for digit, which a careful judge will read as copied, and SDP's T&C make misleading information a disqualification ground (clause 25.1).
Item
Can go on the slide now?
Why
Four prediction inputs (trained model, IoT river sensor, MetMalaysia API, CCTV)
Yes
It is a design, stated as a design
Model names and jobs (flood-susceptibility map, impervious-surface map, rainfall trigger)
Yes
Describes what each model does, not how well
FloodWay Random Forest 74.55%
Yes, labelled "initial split, prototype"
Already handled in the deck
GINKGO Model 1 table (HistGradientBoosting 99.62% and the rest)
Not yet
99.6% on pixel data with a random split is the classic sign of spatial leakage; re-test first
GINKGO Model 2 table ("Siamese U-Net + RF" 99.62%)
No
It is the Model 1 table with a new label; the real Model 2 numbers are unknown
"Sub-second" scoring, latency and model size
Not yet
Measured on what hardware and how many pixels is not stated
IoT sensor accuracy, CCTV accuracy
No
Nothing built or measured yet; show as targets
Two other cautions. GINKGO won Silver at PLAN-AI 2026; check PLAN-AI's IP terms before reusing its models, because SDP's T&C license Background IP to SDP perpetually. And GINKGO's slide 6 still contains the placeholder "[insert model / platform name]"; remove it if any GINKGO slide is reused.
The four inputs and how they combine
Each input answers a different question at a different speed, so FloodWay combines them with a small rule set instead of one more trained model. Rules are explainable to a judge and to a township manager, and they work before there is enough local data to train a fusion model.
The levels reuse JPS's Normal, Alert, Warning and Danger, so residents see one familiar scale. Every threshold below is an example to set at installation and tune in the pilot.
Level
Raised when (example rules)
What residents get
Normal
No input above its first threshold
App shows green
Alert
MetMalaysia heavy-rain warning for the district while the area's susceptibility is High (65 or more out of 100), or the rainfall model's probability passes its alert threshold
Notice to check the route and nearest PPS
Warning
River level above the surveyed warning mark, or the level rising faster than the set rate while heavy rain is forecast
Push alert, route pre-loaded, beacon amber
Danger
River level above the surveyed danger mark, or any two inputs at Warning together (for example CCTV sees water over the road while the river is at Warning)
Evacuate prompt, route to nearest open PPS, beacon red
Why this order matters for the pitch: the trained models say where to put sensors and which roads to watch; the forecast buys hours; the river node and CCTV confirm what is happening in minutes. The trained models alone cannot do the last part, which is why the IoT node is the piece to build first.
Model inventory
FloodWay for SDP would run three trained models and one vision check, each with a different job; only the Random Forest has a figure that is ready to show, and even that one is a prototype. Details below come from the GINKGO deck (PLAN-AI 2026, Aug 2026) and the FloodWay project report v2.2.
Model
Job in the SDP design
Input data (as stated by the team)
Output
Claimed result
Owner
Status
GINKGO Model 1: flood risk
Where floods are likely: a susceptibility map
Sentinel-2 bands B02, B03, B04, B08, B11; NDWI, MNDWI, NDVI, NDBI; Copernicus DEM, slope, topographic wetness index; distance to watercourse and flow accumulation; "Kaggle Satellite Flood and Earth Observation Dataset", 100,000+ pixel instances
Score 0-100: Low 0-35, Moderate 35-65, High 65-100
HistGradientBoosting 99.62% accuracy; precision, recall and F1 all 99.33%
Nadi
Trained for PLAN-AI; needs a spatial re-test
GINKGO Model 2: impervious surface
How much land is sealed, and how that changes, which drives runoff
Bi-temporal Sentinel-2 patches (T1, T2); NDBI, NDVI, NDWI, urban index; DEM, slope, roughness; distance to roads and drains
Density score 0-100 with Low, Moderate, High badges
Table identical to Model 1
Tisya
Real results unknown
FloodWay Random Forest
When a flood is likely: event probability by district
Rainfall 2000-2010 (monthly, state and district); JPS flood incidents 2015-2021; rainfall forecast
Probability and risk class
74.55% accuracy, initial split
FloodWay team
Prototype; data periods do not overlap
Gemini vision check
Is there water in a photo or CCTV frame, and how much
Resident photos, CCTV frames
Water yes or no, severity, confidence
Not measured
Luqman
Prototype; check the model ID, since Gemini 1.5 Flash was retired
Two things stand out. GINKGO Model 1 was trained on a Kaggle dataset, but its study area is Selayang; whether the training pixels are Malaysian is not stated, and a model trained elsewhere can fail on Malaysian cloud, haze and land cover. And GINKGO's rainfall input is a set of fixed scenarios (50, 120 and 200 mm/hr), not a live forecast, so Model 1 says where risk is high under a storm, not when the storm comes.
GINKGO Model 1: flood risk
The feature set is strong and sensible for a susceptibility map, but the 99.62% headline is almost certainly inflated by how the test pixels were chosen; expect a realistic, spatially tested score to be noticeably lower.
What is credible
• The inputs are the standard ones for flood susceptibility. Elevation, slope, wetness index, distance to rivers, flow accumulation and land cover are the usual predictors, and Sentinel-2 at 10 m is fine for township scale.
• The output fits SDP. A 0-100 score with Low, Moderate and High bands maps directly to township planning, and the High band ("excluded from building footprint") speaks SDP's language.
• The model sizes and speeds are plausible for scikit-learn models of these types: a 34 KB decision tree, a 2.4 MB random forest, a 0.9 KB logistic regression.
Red flags a judge will spot
1. A single decision tree scores 99.38%. When one tree almost matches boosting, the label is usually a simple rule of the inputs. If the flood labels were drawn from a water index (NDWI or MNDWI) of the same image, the model is relearning the index, not predicting floods.
2. Random pixel splits leak. Neighbouring pixels are nearly identical, so with a random split the test set sits beside its own training pixels. A remote-sensing study found random hold-out validation overestimated CNN accuracy by up to 28% compared with spatially blocked validation (Kattenborn et al. 2022); a large biomass-mapping study reached the same conclusion, as its title says: "Spatial validation reveals poor predictive performance of large-scale ecological mapping models" (Ploton et al. 2020; full text not readable from here).
3. Precision, recall and F1 are all exactly 99.33%. That happens only when false positives equal false negatives. Possible, but worth checking against the confusion matrix.
4. "Sub-second" and "latency per 100k pixels" have no hardware stated. Say which machine and which image size, or drop the claim.
5. Training data provenance is vague. "Kaggle Satellite Flood and Earth Observation Dataset" needs an exact URL, licence, location and date range.
Tests that settle it
Test
What it shows
Pass looks like
Spatially blocked cross-validation (for example 1 km blocks, or whole scenes held out)
Real accuracy on unseen places
Score drops but stays well above the baseline
Leave-one-flood-event-out
Whether it generalises to a new storm
Similar score across events
Drop NDWI and MNDWI, retrain
Whether the label leaks from a water index
Small drop is fine; a collapse means leakage
External check at known hotspots (DBKL and MBSA lists, JPS incidents, news reports)
Hit rate of the High band where floods really happened
High band covers most known hotspots, few random points
Per-class F1, Cohen's kappa, confusion matrix
Whether the rare High class is found
High-class F1 reported, not just overall accuracy
GINKGO Model 2: impervious surface
Model 2's published benchmark is Model 1's table with the top-row label changed, so its real performance is unknown and nothing from that table should be reused.
Metric
Model 1 top row (HistGradientBoosting)
Model 2 top row ("Siamese U-Net + RF (Hist)")
Accuracy
99.62%
99.62%
Precision
99.33%
99.33%
Recall
99.33%
99.33%
F1
99.33%
99.33%
Model size
190.7 KB
190.7 KB
Latency per 100k pixels
125.34 ms
125.34 ms
Training time
2.8569 s
2.8569 s
The Random Forest, Decision Tree and Logistic Regression rows also match to the second decimal in both tables. Three further signs confirm a copy rather than a coincidence: the label still carries "(Hist)" from HistGradientBoosting; a Siamese U-Net has far more parameters than fit in 190.7 KB; and a U-Net does not train in under 3 seconds on 100,000 samples.
What Tisya should re-run and report
• Segmentation metrics on held-out tiles: intersection over union (IoU) and F1 for the impervious class, on tiles from areas not used in training.
• Change detection on changed pixels only: precision and recall for "vegetation to built-up", which is a rare class and the one that matters for runoff.
• A public baseline: compare with an existing 10 m land-cover product such as ESA WorldCover or Google's Dynamic World, which a 2022 comparison study evaluated side by side. If the U-Net does not beat a free product, say so and use the product.
• Honest size and speed: parameter count, model file size, training hardware and time.
If the re-run cannot happen before the deadline, describe Model 2 on the slide as "impervious-surface mapping (evaluation in progress)" with no numbers.
FloodWay Random Forest: rainfall trigger
The Random Forest is the only model whose figure is already in the SDP deck, presented as a prototype: 74.55% accuracy on an initial split, 1.8 points above the Decision Tree. Its full evaluation, including why the five accuracy figures cannot share one test set and why rainfall data ending in 2010 does not overlap flood labels from 2015-2021, is in the FloodWay supporting documentation (Model evaluation section).
In the four-input design its job is narrower than before. The GINKGO map says where, the MetMalaysia forecast says when, and the Random Forest turns forecast rainfall plus flood history into a district probability that can raise the level to Alert. It does not need to be street-level, because the river node and CCTV supply the local confirmation.
One thing to fix: 74.55% and 99.62% will now sit side by side in the same pitch. Say in one line that they measure different tasks (an event forecast versus a map of where water collects), or a judge will ask why the team kept the weaker model.
IoT sensor, MetMalaysia API and CCTV: how each input is checked
The three non-model inputs are easier to test than the models, and the river node can supply the labels that the CCTV check needs: when a camera watches the node's staff gauge, every frame comes with a measured water level.
IoT river node (FloodWay RiverNode)
The node measures distance down to the water with a waterproof ultrasonic sensor. The proposed sensor, DFRobot A02YYUW, is rated for 3-450 cm with a 3 cm blind zone, a 60 degree beam, IP67, under 8 mA average draw and -15 to 60 °C (Core Electronics listing). The seller page states no accuracy, so the team must measure it.
Check
How
Pass looks like
Bench accuracy
Mount over a bucket or floor; compare with a tape measure at 0.5, 1, 2, 3 and 4 m, 20 readings each
Mean error and spread stated per distance
Heat drift
Repeat at 8 am and 3 pm; sound travels about 0.17% faster per °C, so a 10 °C change shifts a 3 m reading by about 5 cm unless corrected
Error stays inside the bench figure after temperature correction
Real-river reading
Compare with the staff gauge every hour for a week
Agreement within a few centimetres
Power autonomy
Run with the solar panel covered
Days of operation without sun
Radio range
Walk the gateway away from the river until packets drop
Range in metres at the pilot site
MetMalaysia API
Malaysia's open-data portal serves MetMalaysia forecasts and weather warnings through a public API (data.gov.my weather API); it is not a rainfall-gauge feed. Check it the way a forecast is checked: log each heavy-rain warning for the pilot district, then record whether the node's rain gauge saw heavy rain in that window. The result is a hit rate and a false-alarm rate for the local area, which sets how much weight the warning gets in the fusion rules.
CCTV
Luqman's design analyses frames over 10-20 seconds against a marked shore line and outputs a warning level. Test it on a labelled set of frames that includes night, rain on the lens, glare and people walking past. Report precision and recall for "water above the line" and the delay from the water crossing the line to the alert. If the camera can see the node's staff gauge, the node's level readings label the frames automatically, which removes most of the manual labelling.
An honest model table for the slide
Luqman's "model trained table" can go on the SDP slide in this form tonight: it names every model, its job and its data, and shows only numbers the team can defend. Replace each TBD once the re-tests in the next section are done.
Input
Model or method
Data
Result to show
Status
Where floods are likely
Gradient boosting and Random Forest susceptibility map (GINKGO Model 1)
Sentinel-2, Copernicus DEM, river distance
Spatially tested F1 for the High class: TBD
Trained; re-test in progress
How much land is sealed
Siamese U-Net change detection (GINKGO Model 2)
Bi-temporal Sentinel-2
IoU on held-out tiles: TBD
Evaluation in progress
When a flood is likely
Random Forest on rainfall and flood history
Public rainfall, JPS flood incidents, forecast
74.55% accuracy, initial split (prototype)
Prototype
When heavy rain is coming
MetMalaysia forecasts and warnings
data.gov.my API
Local hit rate: measured in pilot
Integration ready
What the river is doing
Ultrasonic river node, rule-based
Own sensor
Bench error: TBD cm
Design; build after Top 10
What people would see
Vision check of CCTV frames
Township or own camera
Precision and recall: TBD
Prototype
If the team wants one strong number on the slide, the safest is the river node's measured bench error, because it can be measured in an afternoon and checked by anyone with a tape measure.

Pages opened for this document, accessed 20 October 2026, plus the team's own material.
• Team material: GINKGO slide deck (PLAN-AI Hackathon 2026, Track B, Aug 2026), the two AI Model infographics, FloodWay Project Report v2.2 (Feb 2026), team chat of 20 Oct 2026
• Kattenborn et al. 2022, ISPRS Open Journal of Photogrammetry and Remote Sensing: random validation overestimated CNN accuracy by up to 28%
• Ploton et al. 2020, Nature Communications: title and abstract listing only; full text blocked
• Comparison of Dynamic World, ESA WorldCover and Esri land cover, Remote Sensing 2022
• A02YYUW waterproof ultrasonic sensor specifications, Core Electronics
• data.gov.my weather API
• RTM, 18 Jul 2026: JPS river levels above waspada, amaran and bahaya
• Cetecom: Malaysia short-range device update, LoRa 916-924 MHz under class assignment (2020)
• FloodWay supporting documentation (SDP hackathon), for the Random Forest evaluation

Update, 20 Oct 2026 (late): the GINKGO Model 1 files, inspected
The four trained files are now in the FloodWay repo (`models/ginkgo/`). They were loaded with scikit-learn 1.7.2, the version they were saved with, and checked by `models/ginkgo/inspect_models.py`. The training data is not in the repo, so this is an inspection of the files, not an accuracy test. Full card: `models/ginkgo/MODEL_CARD.md` (copy in this folder: `GINKGO_Model1_card.md`).
What the files show
• Eight unnamed inputs. Every model takes exactly 8 numbers, and the feature names were not saved. The infographic lists at least 14 inputs (five Sentinel-2 bands, four indices, DEM, slope, wetness index, river distance, flow accumulation). The files do not match that list.
• Two classes. The output is class 0 or 1, not a 0 to 100 score in three bands. The score must be the class-1 probability × 100; the owner should confirm.
• A hard rule at the top of the decision tree. The first split is "input 3 <= 1.5", and that branch always predicts "no flood". Input 3 looks like a category or a scenario number (the GINKGO rainfall scenarios were 50, 120 and 200 mm/hr). If it encodes the scenario or something derived from the label, it explains the 99% accuracy, and the leakage test should drop it first.
• One input dominates the linear baseline. Logistic regression weights input 6 at +2.2; every other weight is under 0.1.
• The published sizes are these files. 190.7 KB, 2361.4 KB, 34.0 KB and 0.9 KB match the four files exactly. The "Model 2: Siamese U-Net" table repeats the same sizes, which confirms it was copied from Model 1.
• Speed, timing only: 13 to 305 ms for 100,000 random rows on the team laptop, depending on the model. This supports "sub-second for 100,000 rows on this laptop" and nothing more.
What to ask Nadi for, before any re-test
1. The feature list in training order, with units, and the dataset URL, licence, location and dates.
2. The training notebook, including how the label was made and how the test split was drawn.
Until then, Model 1 on any slide is "re-test pending", with no number.
