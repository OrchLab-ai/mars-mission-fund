-- migrate:up

-- Seed 10 campaigns covering 7 categories and multiple statuses
-- Using fixed UUIDs for FK references within this file

-- Campaigns
INSERT INTO campaigns (
  id, slug, title, summary, description, alignment_statement,
  category, tags, status, hero_image_url,
  min_funding_target_usd, max_funding_cap_usd, current_amount_usd,
  contributor_count, deadline, launched_at
) VALUES
  (
    '00000000-0001-0000-0000-000000000001',
    'methane-bipropellant-engine',
    'Methane Bi-Propellant Engine Testbed',
    'Building and flight-qualifying a full-flow staged-combustion methane/LOX engine optimised for Mars ascent.',
    '<p>A reliable methane/LOX engine is the lynchpin of Mars return missions because methane can be manufactured on Mars from atmospheric CO₂ and subsurface water ice. Our team of propulsion engineers is designing a full-flow staged-combustion engine targeting 300 kN thrust with a specific impulse above 360 s. The testbed will be open-hardware so any launch provider can iterate on the design.</p>',
    'An open-source, Mars-return-capable engine directly enables the ''get there and back'' foundation that every other Mars mission depends on.',
    'Propulsion',
    ARRAY['propulsion', 'methane', 'engine', 'open-hardware'],
    'Live',
    'https://images.unsplash.com/photo-1517976487492-5750f3195933?w=1200',
    500000000, 2000000000, 1250000000,
    4200, '2026-09-30 23:59:59+00', '2026-01-15 09:00:00+00'
  ),
  (
    '00000000-0002-0000-0000-000000000002',
    'aeroshell-heat-shield',
    'Adaptive Aeroshell Heat Shield',
    'Developing a deployable aeroshell heat shield rated for crewed Mars entry, descent, and landing.',
    '<p>Landing anything heavier than a rover on Mars requires a heat shield far larger than any flown to date. Our inflatable aeroshell design deploys from a 4 m stowed diameter to 16 m, giving enough drag to decelerate a 20-tonne crewed lander through the thin Martian atmosphere. Wind-tunnel and arc-jet testing is complete; this campaign funds the orbital demonstration flight.</p>',
    'Solving the Mars EDL mass problem is a gate that must open before any crewed surface mission can proceed.',
    'Entry, Descent & Landing',
    ARRAY['edl', 'heat-shield', 'aeroshell', 'landing'],
    'Funded',
    'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200',
    300000000, 1000000000, 875000000,
    3100, '2026-03-01 23:59:59+00', '2025-10-01 09:00:00+00'
  ),
  (
    '00000000-0003-0000-0000-000000000003',
    'kilopower-reactor-array',
    'Kilopower Fission Reactor Array',
    'Scaling a 10 kWe space-rated fission reactor into a field-deployable array providing 40 kWe for a Mars surface base.',
    '<p>Solar panels on Mars produce roughly 40% of their Earth output and nothing at all during month-long dust storms. A compact fission reactor array provides reliable baseload power for life support, ISRU, and communications regardless of weather or season. Our design chains four 10 kWe Stirling-cycle units with shared heat rejection, fitting inside a single lander cargo bay.</p>',
    'Reliable power is the single largest enabler of sustained human presence on Mars; without it, every other surface system fails.',
    'Power & Energy',
    ARRAY['fission', 'reactor', 'power', 'kilopower', 'stirling'],
    'Live',
    'https://images.unsplash.com/photo-1536408745983-0f03be6e8858?w=1200',
    200000000, 600000000, 310000000,
    1850, '2026-07-15 23:59:59+00', '2026-02-01 09:00:00+00'
  ),
  (
    '00000000-0004-0000-0000-000000000004',
    'inflatable-hab-module',
    'Inflatable Habitat Module',
    'Designing and pressure-testing an inflatable habitat module providing 330 m³ of crew living space on the Martian surface.',
    '<p>Rigid habitat modules are constrained by launch-fairing diameter. Our inflatable design launches compactly and expands on-site to provide a two-storey pressurised volume with integrated radiation shielding, a galley, crew quarters for six, a medical bay, and an EVA airlock. The multi-layer shell uses Vectran restraint layers and boron-loaded polyethylene for secondary cosmic-ray protection.</p>',
    'Liveable crew volume is a prerequisite for any mission longer than 30 days; an inflatable architecture dramatically reduces launch mass per habitable cubic metre.',
    'Habitats & Construction',
    ARRAY['habitat', 'inflatable', 'crew', 'construction'],
    'Complete',
    'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=1200',
    150000000, 500000000, 498000000,
    5600, '2025-12-31 23:59:59+00', '2025-06-01 09:00:00+00'
  ),
  (
    '00000000-0005-0000-0000-000000000005',
    'closed-loop-life-support',
    'Closed-Loop Life Support System',
    'Building a bioregenerative life support system that recycles 98% of water and 75% of oxygen for a six-person Mars crew.',
    '<p>Resupply from Earth is not an option for a Mars surface crew. Our closed-loop environmental control and life support system (ECLSS) combines physicochemical CO₂ removal with a bioregenerative algae loop for O₂ regeneration and greywater recycling. The system targets 98% water recovery and 75% O₂ closure, dramatically reducing the consumables mass budget for a 500-day surface stay.</p>',
    'Life support closure rate directly determines mission duration and crew safety; higher closure means longer, safer missions with less launched mass.',
    'Life Support & Crew Health',
    ARRAY['life-support', 'eclss', 'water', 'oxygen', 'bioregenerative'],
    'Live',
    'https://images.unsplash.com/photo-1628126235206-5260b9ea6441?w=1200',
    400000000, 800000000, 523000000,
    2700, '2026-06-30 23:59:59+00', '2026-01-20 09:00:00+00'
  ),
  (
    '00000000-0006-0000-0000-000000000006',
    'greenhouse-dome-prototype',
    'Mars Greenhouse Dome Prototype',
    'Prototyping a pressurised greenhouse dome capable of growing 50% of a six-person crew''s caloric needs using Martian regolith.',
    '<p>A self-sustaining Mars base must grow food locally. Our greenhouse dome is a 12 m diameter inflatable structure with UV-filtering panels, LED supplemental lighting, and hydroponic/aeroponic grow beds. Regolith-based growing media is processed on-site to remove perchlorates. The prototype will be tested in a Mars-analog environment in Iceland for 12 months to validate crop yield projections.</p>',
    'Local food production is essential for crew nutrition, morale, and reducing dependence on Earth resupply for missions beyond 18 months.',
    'Food & Water Production',
    ARRAY['greenhouse', 'food', 'agriculture', 'regolith', 'hydroponic'],
    'Funded',
    'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=1200',
    250000000, 750000000, 720000000,
    4800, '2026-02-28 23:59:59+00', '2025-09-01 09:00:00+00'
  ),
  (
    '00000000-0007-0000-0000-000000000007',
    'sabatier-propellant-plant',
    'Sabatier Propellant Production Plant',
    'Building a pilot-scale ISRU plant that converts Martian CO₂ and water ice into methane propellant and oxygen.',
    '<p>Manufacturing propellant on Mars eliminates the need to launch return-trip fuel from Earth, cutting mission mass by more than half. Our Sabatier reactor combines atmospheric CO₂ with hydrogen (electrolysed from subsurface water ice) to produce methane and water. The water is recycled back into the electrolysis loop. This campaign funds the first integrated pilot plant rated for 1 kg/hr methane output.</p>',
    'In-situ propellant production is the economic keystone of a sustainable Mars programme — without it, every return trip requires launching fuel from Earth at enormous cost.',
    'In-Situ Resource Utilisation',
    ARRAY['isru', 'sabatier', 'propellant', 'methane', 'mining'],
    'Live',
    'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1200',
    180000000, 500000000, 195000000,
    1200, '2026-08-31 23:59:59+00', '2026-02-15 09:00:00+00'
  ),
  (
    '00000000-0008-0000-0000-000000000008',
    'superconducting-radiation-shelter',
    'Superconducting Radiation Shelter',
    'Developing a superconducting-magnet active radiation shield to protect crew during transit and solar particle events.',
    '<p>Galactic cosmic rays and solar particle events are the top health risk for Mars-transit crews. Passive shielding alone would require impractical mass. Our active shield uses high-temperature superconducting coils cooled by a cryocooler to generate a 5 T magnetic dipole field that deflects charged particles. The shelter doubles as a storm shelter during solar events, reducing crew dose to below NASA career limits for a 2.5-year round trip.</p>',
    'Radiation exposure is the primary biomedical constraint on deep-space missions; an active shield converts an infeasible dose budget into an acceptable one.',
    'Radiation Protection',
    ARRAY['radiation', 'shielding', 'superconducting', 'magnet', 'crew-safety'],
    'Complete',
    'https://images.unsplash.com/photo-1581822261290-991b38693d1b?w=1200',
    1000000000, 3000000000, 2850000000,
    9200, '2025-11-30 23:59:59+00', '2025-01-01 09:00:00+00'
  ),
  (
    '00000000-0009-0000-0000-000000000009',
    'autonomous-regolith-excavator',
    'Autonomous Regolith Excavator',
    'Building an autonomous excavation rover that prepares landing pads, berms, and foundation trenches from Martian regolith.',
    '<p>Before a crew arrives, robotic systems must prepare the surface: levelling landing pads, building regolith berms for blast protection, and trenching foundations for habitat anchoring. Our excavator uses a drum-cutter head, autonomous path planning, and a LiDAR terrain model to operate without real-time Earth control. The rover is solar-powered with a RTG backup for dust-storm operations.</p>',
    'Autonomous site preparation is a prerequisite for safe crewed landing and habitat deployment; every surface architecture plan depends on earthmoving capability arriving first.',
    'Robotics & Automation',
    ARRAY['robotics', 'excavation', 'autonomous', 'regolith', 'rover'],
    'Live',
    'https://images.unsplash.com/photo-1485460310769-1c83f7c4f69e?w=1200',
    120000000, 400000000, 118000000,
    890, '2026-05-31 23:59:59+00', '2026-02-20 09:00:00+00'
  ),
  (
    '00000000-0010-0000-0000-000000000010',
    'laser-optical-relay-network',
    'Laser Optical Relay Network',
    'Deploying a constellation of three Mars-orbit relay satellites for high-bandwidth laser-optical comms with Earth.',
    '<p>Current Mars communication relies on ageing orbiters with radio links capped at 2 Mbps. Our laser-optical relay network places three satellites in areostationary orbit, providing continuous 100 Mbps links to Earth ground stations via 1550 nm laser terminals. The constellation also carries UHF transponders for surface-to-orbit relay, replacing dependency on NASA''s Mars Relay Network. This campaign funds the flight units and rideshare launch.</p>',
    'High-bandwidth, low-latency communication is essential for crew safety, scientific return, and public engagement with Mars exploration.',
    'Communications & Navigation',
    ARRAY['comms', 'laser', 'optical', 'relay', 'satellite'],
    'Funded',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200',
    600000000, 1500000000, 1420000000,
    6300, '2026-01-31 23:59:59+00', '2025-07-01 09:00:00+00'
  )
ON CONFLICT DO NOTHING;

-- Milestones for campaign 1: Methane Bi-Propellant Engine
INSERT INTO campaign_milestones (id, campaign_id, title, description, target_date, funding_pct, verification_criteria, status, sort_order) VALUES
  ('10000000-0001-0001-0000-000000000001', '00000000-0001-0000-0000-000000000001', 'Injector & Turbopump Prototype', 'Design and fabricate the injector head and turbopump assembly; complete cold-flow testing.', '2026-04-30', 25, 'Fabrication completion report; cold-flow test data showing target mass-flow rates within 5% tolerance; peer review sign-off.', 'Pending', 1),
  ('10000000-0001-0002-0000-000000000001', '00000000-0001-0000-0000-000000000001', 'Short-Duration Hot-Fire Tests', 'Conduct 10 hot-fire tests of 15 s duration at the Stennis E-1 test stand; validate thrust and Isp targets.', '2026-07-31', 35, 'Telemetry data from 10 firings; thrust ≥ 280 kN sustained; nozzle inspection showing acceptable erosion.', 'Pending', 2),
  ('10000000-0001-0003-0000-000000000001', '00000000-0001-0000-0000-000000000001', 'Full-Duration Qualification Burn', 'Complete a 240 s full-duration burn simulating Mars ascent profile; publish open-hardware design package.', '2026-09-30', 40, 'Full-duration burn telemetry; Isp ≥ 360 s confirmed; open-hardware repo published with CAD, BOM, and test reports.', 'Pending', 3)
ON CONFLICT DO NOTHING;

-- Milestones for campaign 2: Aeroshell Heat Shield
INSERT INTO campaign_milestones (id, campaign_id, title, description, target_date, funding_pct, verification_criteria, status, sort_order) VALUES
  ('10000000-0002-0001-0000-000000000002', '00000000-0002-0000-0000-000000000002', 'Arc-Jet Material Qualification', 'Complete arc-jet testing of all TPS material candidates at Mars-entry heat flux levels.', '2025-11-30', 20, 'Arc-jet test reports for 5 material samples; selection memo signed by chief engineer.', 'Verified', 1),
  ('10000000-0002-0002-0000-000000000002', '00000000-0002-0000-0000-000000000002', 'Subscale Inflation & Wind-Tunnel Tests', 'Fabricate and test a 4 m subscale inflatable aeroshell in hypersonic wind tunnel.', '2026-01-31', 40, 'Wind-tunnel data at Mach 20–30; structural integrity confirmed; drag coefficient within 8% of CFD prediction.', 'Verified', 2),
  ('10000000-0002-0003-0000-000000000002', '00000000-0002-0000-0000-000000000002', 'Orbital Demonstration Flight', 'Launch full-scale 16 m aeroshell on a suborbital reentry trajectory to validate integrated TPS and deployment.', '2026-02-28', 40, 'Flight telemetry; recovered hardware inspection; TPS recession within design margins; post-flight report published.', 'Submitted', 3)
ON CONFLICT DO NOTHING;

-- Milestones for campaign 3: Kilopower Reactor Array
INSERT INTO campaign_milestones (id, campaign_id, title, description, target_date, funding_pct, verification_criteria, status, sort_order) VALUES
  ('10000000-0003-0001-0000-000000000003', '00000000-0003-0000-0000-000000000003', 'Single-Unit Criticality Test', 'Achieve first criticality on a single 10 kWe reactor unit at the Nevada National Security Site.', '2026-03-31', 30, 'Criticality test report; 10 kWe sustained output for 28 days; radiation survey within exclusion-zone limits.', 'Pending', 1),
  ('10000000-0003-0002-0000-000000000003', '00000000-0003-0000-0000-000000000003', 'Four-Unit Array Integration', 'Integrate four reactor units with shared heat-rejection radiator panels and power management system.', '2026-06-30', 40, 'Integrated power output ≥ 38 kWe; thermal balance test in vacuum chamber; EMI compatibility confirmed.', 'Pending', 2),
  ('10000000-0003-0003-0000-000000000003', '00000000-0003-0000-0000-000000000003', 'Environmental Qualification & Delivery', 'Complete vibration, thermal-vacuum, and radiation qualification; deliver flight unit to integration facility.', '2026-09-30', 30, 'Qualification test reports; flight unit acceptance review passed; shipping documentation.', 'Pending', 3)
ON CONFLICT DO NOTHING;

-- Milestones for campaign 4: Inflatable Habitat Module (Complete)
INSERT INTO campaign_milestones (id, campaign_id, title, description, target_date, funding_pct, verification_criteria, status, sort_order) VALUES
  ('10000000-0004-0001-0000-000000000004', '00000000-0004-0000-0000-000000000004', 'Shell Fabrication & Pressure Test', 'Fabricate the multi-layer shell and pressurize to 1.5x nominal for burst-margin validation.', '2025-08-31', 25, 'Shell fabrication report; pressure test data showing hold at 150 kPa for 72 h with zero measurable leak rate.', 'Verified', 1),
  ('10000000-0004-0002-0000-000000000004', '00000000-0004-0000-0000-000000000004', 'Integrated Fit-Out & Systems Test', 'Install galley, crew quarters, medical bay, ECLSS interfaces, and airlock; conduct integrated systems test.', '2025-10-31', 35, 'Systems test report; all subsystems nominal; simulated EVA egress/ingress cycle completed.', 'Verified', 2),
  ('10000000-0004-0003-0000-000000000004', '00000000-0004-0000-0000-000000000004', 'Crew-in-the-Loop Analog Mission', 'Six crew members live in the habitat for 60 days at a Mars-analog site in Utah; collect human-factors data.', '2025-12-31', 40, 'Analog mission completion report; crew survey data; medical monitoring records; lessons-learned document published.', 'Verified', 3)
ON CONFLICT DO NOTHING;

-- Milestones for campaign 5: Closed-Loop Life Support
INSERT INTO campaign_milestones (id, campaign_id, title, description, target_date, funding_pct, verification_criteria, status, sort_order) VALUES
  ('10000000-0005-0001-0000-000000000005', '00000000-0005-0000-0000-000000000005', 'CO₂ Removal & O₂ Regeneration Loop', 'Demonstrate the integrated CO₂ scrubber and algal O₂ regeneration loop at full crew-equivalent throughput.', '2026-03-31', 20, 'Loop closure data showing ≥ 75% O₂ recovery; CO₂ partial pressure maintained below 5.3 mmHg for 30 days.', 'Pending', 1),
  ('10000000-0005-0002-0000-000000000005', '00000000-0005-0000-0000-000000000005', 'Water Recovery Subsystem', 'Integrate and test the greywater recycling loop targeting 98% water recovery rate.', '2026-05-31', 45, 'Water quality analysis (meeting NASA potable standards); 98% recovery demonstrated over 14-day continuous run.', 'Pending', 2),
  ('10000000-0005-0003-0000-000000000005', '00000000-0005-0000-0000-000000000005', 'Full ECLSS Integration Test', 'Run the complete integrated ECLSS with six crew-equivalent metabolic simulators for 90 days.', '2026-06-30', 35, '90-day run log with no critical failures; consumables mass budget validated; maintenance schedule published.', 'Pending', 3)
ON CONFLICT DO NOTHING;

-- Milestones for campaign 6: Mars Greenhouse Dome
INSERT INTO campaign_milestones (id, campaign_id, title, description, target_date, funding_pct, verification_criteria, status, sort_order) VALUES
  ('10000000-0006-0001-0000-000000000006', '00000000-0006-0000-0000-000000000006', 'Regolith Processing & Growth Media', 'Develop and validate a perchlorate-removal process for Martian regolith simulant to produce safe growth media.', '2025-11-30', 30, 'Perchlorate levels below 0.01 ppm in processed media; crop germination rates ≥ 90% in treated simulant.', 'Verified', 1),
  ('10000000-0006-0002-0000-000000000006', '00000000-0006-0000-0000-000000000006', 'Dome Fabrication & Pressurisation', 'Fabricate the 12 m dome, install UV-filtering panels and LED arrays, and validate pressure integrity.', '2026-01-31', 35, 'Dome holds 101 kPa for 30 days; UV transmission spectrum confirmed; LED photon flux at canopy level measured.', 'Verified', 2),
  ('10000000-0006-0003-0000-000000000006', '00000000-0006-0000-0000-000000000006', 'Iceland Analog 12-Month Grow Trial', 'Operate the greenhouse in Iceland for 12 months, measuring crop yields against caloric-need targets.', '2026-02-28', 35, 'Monthly harvest logs; total caloric output ≥ 50% of six-person crew requirement; peer-reviewed paper submitted.', 'Pending', 3)
ON CONFLICT DO NOTHING;

-- Milestones for campaign 7: Sabatier Propellant Plant
INSERT INTO campaign_milestones (id, campaign_id, title, description, target_date, funding_pct, verification_criteria, status, sort_order) VALUES
  ('10000000-0007-0001-0000-000000000007', '00000000-0007-0000-0000-000000000007', 'Sabatier Reactor Bench Test', 'Demonstrate the Sabatier reaction at target conversion efficiency with Mars-simulant CO₂ feedstock.', '2026-05-31', 35, 'Reactor test data showing ≥ 95% CO₂ conversion; methane purity ≥ 99%; thermal management validated.', 'Pending', 1),
  ('10000000-0007-0002-0000-000000000007', '00000000-0007-0000-0000-000000000007', 'Electrolyser & Water Loop Integration', 'Integrate the water electrolyser with the Sabatier reactor to close the hydrogen loop.', '2026-07-31', 35, 'Closed-loop operation for 7 days; hydrogen recovery ≥ 90%; system mass and power budgets confirmed.', 'Pending', 2),
  ('10000000-0007-0003-0000-000000000007', '00000000-0007-0000-0000-000000000007', 'Pilot Plant 1 kg/hr Demonstration', 'Operate the full pilot plant at 1 kg/hr methane output for 30 continuous days.', '2026-08-31', 30, '30-day operations log; 720 kg methane produced; maintenance downtime < 5%; public design package released.', 'Pending', 3)
ON CONFLICT DO NOTHING;

-- Milestones for campaign 8: Superconducting Radiation Shelter (Complete)
INSERT INTO campaign_milestones (id, campaign_id, title, description, target_date, funding_pct, verification_criteria, status, sort_order) VALUES
  ('10000000-0008-0001-0000-000000000008', '00000000-0008-0000-0000-000000000008', 'HTS Coil Fabrication & Cryotest', 'Fabricate high-temperature superconducting coils and validate performance at operating temperature (40 K).', '2025-04-30', 20, 'Coil critical-current measurements; 5 T field achieved; cryocooler steady-state power draw confirmed.', 'Verified', 1),
  ('10000000-0008-0002-0000-000000000008', '00000000-0008-0000-0000-000000000008', 'Particle-Beam Shielding Validation', 'Test the magnetic shield effectiveness against proton beams at Brookhaven National Laboratory.', '2025-07-31', 30, 'Dose-reduction factor ≥ 10x for 100 MeV protons; beam test report; Monte Carlo simulation validation.', 'Verified', 2),
  ('10000000-0008-0003-0000-000000000008', '00000000-0008-0000-0000-000000000008', 'Flight-Qualifiable Shelter Module', 'Deliver a flight-qualifiable shelter module with integrated cryocooler, quench protection, and crew interfaces.', '2025-11-30', 50, 'Qualification test reports; crew dose budget for 2.5-year mission below NASA limits; design review passed.', 'Verified', 3)
ON CONFLICT DO NOTHING;

-- Milestones for campaign 9: Autonomous Regolith Excavator
INSERT INTO campaign_milestones (id, campaign_id, title, description, target_date, funding_pct, verification_criteria, status, sort_order) VALUES
  ('10000000-0009-0001-0000-000000000009', '00000000-0009-0000-0000-000000000009', 'Mobility Platform & Drum Cutter', 'Build the mobility chassis and drum-cutter head; validate digging performance in Mars-regolith simulant.', '2026-03-31', 25, 'Excavation rate ≥ 2 m³/hr in JSC Mars-1A simulant; mobility over 15° slopes confirmed; power budget validated.', 'Pending', 1),
  ('10000000-0009-0002-0000-000000000009', '00000000-0009-0000-0000-000000000009', 'Autonomous Navigation & Planning', 'Integrate LiDAR-based terrain mapping and autonomous path planning; complete 10 km autonomous traverse.', '2026-04-30', 35, '10 km traverse in desert analog with zero human interventions; terrain model accuracy < 5 cm RMSE; obstacle avoidance log.', 'Pending', 2),
  ('10000000-0009-0003-0000-000000000009', '00000000-0009-0000-0000-000000000009', 'Landing Pad Construction Demo', 'Autonomously construct a 30 m diameter levelled landing pad from regolith simulant at a desert test site.', '2026-05-31', 40, 'Completed landing pad survey showing ≤ 2 cm elevation deviation; time-lapse documentation; after-action report.', 'Pending', 3)
ON CONFLICT DO NOTHING;

-- Milestones for campaign 10: Laser Optical Relay Network
INSERT INTO campaign_milestones (id, campaign_id, title, description, target_date, funding_pct, verification_criteria, status, sort_order) VALUES
  ('10000000-0010-0001-0000-000000000010', '00000000-0010-0000-0000-000000000010', 'Laser Terminal Prototype', 'Build and test a 1550 nm laser terminal prototype achieving 100 Mbps over a 500 km free-space link.', '2025-09-30', 25, 'Link budget closure at 100 Mbps; BER < 10⁻⁹; pointing accuracy ≤ 1 µrad demonstrated.', 'Verified', 1),
  ('10000000-0010-0002-0000-000000000010', '00000000-0010-0000-0000-000000000010', 'Satellite Bus Integration', 'Integrate laser terminals and UHF transponders onto three satellite buses; complete thermal-vacuum testing.', '2025-11-30', 40, 'Thermal-vacuum test reports for all three satellites; RF compatibility confirmed; mass and power margins positive.', 'Verified', 2),
  ('10000000-0010-0003-0000-000000000010', '00000000-0010-0000-0000-000000000010', 'Rideshare Launch & Commissioning', 'Launch all three satellites and complete on-orbit commissioning including end-to-end data relay test.', '2026-01-31', 35, 'On-orbit checkout reports; 100 Mbps link demonstrated Earth-to-orbit; UHF surface relay validated; constellation declared operational.', 'Submitted', 3)
ON CONFLICT DO NOTHING;

-- Stretch goals for campaigns 1, 2, and 5
INSERT INTO campaign_stretch_goals (id, campaign_id, target_usd, description, deliverables, sort_order) VALUES
  ('20000000-0001-0001-0000-000000000001', '00000000-0001-0000-0000-000000000001', 1500000000, 'Deep-Throttle Capability', 'Add 10:1 deep-throttle capability for precision hover and landing, extending the engine''s use from ascent to descent stages.', 1),
  ('20000000-0001-0002-0000-000000000001', '00000000-0001-0000-0000-000000000001', 2000000000, 'Reusability Test Programme', 'Fund a 10-flight reusability test programme to validate engine life beyond single-use, reducing per-mission cost by up to 80%.', 2),
  ('20000000-0002-0001-0000-000000000002', '00000000-0002-0000-0000-000000000002', 750000000, 'Precision Landing Guidance', 'Integrate terrain-relative navigation and hazard avoidance into the aeroshell, enabling pinpoint landing within 100 m of a target.', 1),
  ('20000000-0005-0001-0000-000000000005', '00000000-0005-0000-0000-000000000005', 600000000, 'Crop Variety Expansion', 'Add a dedicated growth chamber for high-calorie crops (potatoes, soybeans) and medicinal herbs, increasing dietary diversity.', 1),
  ('20000000-0005-0002-0000-000000000005', '00000000-0005-0000-0000-000000000005', 750000000, 'Aquaponics Integration', 'Integrate a tilapia aquaponics loop for protein production, using fish waste as fertiliser for the hydroponic beds.', 2)
ON CONFLICT DO NOTHING;

-- migrate:down

DELETE FROM campaign_stretch_goals WHERE id IN (
  '20000000-0001-0001-0000-000000000001',
  '20000000-0001-0002-0000-000000000001',
  '20000000-0002-0001-0000-000000000002',
  '20000000-0005-0001-0000-000000000005',
  '20000000-0005-0002-0000-000000000005'
);

DELETE FROM campaign_milestones WHERE campaign_id IN (
  '00000000-0001-0000-0000-000000000001',
  '00000000-0002-0000-0000-000000000002',
  '00000000-0003-0000-0000-000000000003',
  '00000000-0004-0000-0000-000000000004',
  '00000000-0005-0000-0000-000000000005',
  '00000000-0006-0000-0000-000000000006',
  '00000000-0007-0000-0000-000000000007',
  '00000000-0008-0000-0000-000000000008',
  '00000000-0009-0000-0000-000000000009',
  '00000000-0010-0000-0000-000000000010'
);

DELETE FROM campaigns WHERE slug IN (
  'methane-bipropellant-engine',
  'aeroshell-heat-shield',
  'kilopower-reactor-array',
  'inflatable-hab-module',
  'closed-loop-life-support',
  'greenhouse-dome-prototype',
  'sabatier-propellant-plant',
  'superconducting-radiation-shelter',
  'autonomous-regolith-excavator',
  'laser-optical-relay-network'
);
