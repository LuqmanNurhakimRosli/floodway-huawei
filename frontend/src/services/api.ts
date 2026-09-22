import { Shelter, CitizenReport, ForecastData } from '../types';

const BACKEND_URL = 'http://localhost:8080/api/v1';

export async function fetchTwinState(deviceId = 'fw-node-01') {
  try {
    const res = await fetch(`${BACKEND_URL}/twin/state?device_id=${deviceId}`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) return await res.json();
  } catch (e) {
    // Graceful fallback to calibrated default
  }
  return {
    device_id: deviceId,
    station_name: 'Kampung Baru Station (Klang River)',
    water_level_m: 1.20,
    water_depth_cm: 120.0,
    rainfall_rate_mm_hr: 95.0,
    phase: 'DANGER',
    is_stale: false,
    forecast: {
      source: 'Huawei ModelArts (Ascend 910 GRU)',
      horizons_min: [0, 15, 30, 45, 60, 90, 120],
      p10: [1.20, 1.25, 1.34, 1.45, 1.55, 1.68, 1.75],
      p50: [1.20, 1.31, 1.48, 1.58, 1.65, 1.82, 1.91],
      p90: [1.20, 1.38, 1.59, 1.72, 1.81, 2.05, 2.18],
      peak_level_m: 1.91,
      time_to_peak_min: 120,
      time_to_danger_min: 45,
      confidence_score: 0.88
    }
  };
}

export async function fetchShelters(): Promise<Shelter[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/shelters`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) return await res.json();
  } catch (e) {}

  return [
    {
      id: 'shelter-01',
      name: 'Dewan Sultan Sulaiman, Kampung Baru',
      category: 'Heritage Civic Hall',
      lat: 3.1635,
      lon: 101.7025,
      address: 'Jalan Dewan Sultan Sulaiman, Kampung Baru, 50300 Kuala Lumpur',
      status: 'OPEN',
      currentCapacity: 145,
      maxCapacity: 250,
      contact: '+603-2692 1445',
      facilities: ['Medical Station', 'Emergency Kitchen', 'First Aid', 'Generator Backup'],
      elevationM: 38.0,
      routeStatus: 'CLEAR',
      distanceKm: 0.4,
      travelTimeMin: 3
    },
    {
      id: 'shelter-02',
      name: 'Kompleks Sukan Titiwangsa',
      category: 'Sports Arena Relief Center',
      lat: 3.1782,
      lon: 101.7088,
      address: 'Jalan Kuantan, Titiwangsa, 53200 Kuala Lumpur',
      status: 'OPEN',
      currentCapacity: 210,
      maxCapacity: 500,
      contact: '+603-4021 3455',
      facilities: ['Indoor Stadium Floor', 'Helipad Access', 'Medical Tents', 'Clean Water Filtration'],
      elevationM: 42.0,
      routeStatus: 'CLEAR',
      distanceKm: 2.1,
      travelTimeMin: 6
    },
    {
      id: 'shelter-03',
      name: 'Dewan Komuniti Sentul Perdana (DBKL)',
      category: 'Community Center',
      lat: 3.1818,
      lon: 101.6912,
      address: 'Bandar Baru Sentul, 51000 Kuala Lumpur',
      status: 'OPEN',
      currentCapacity: 120,
      maxCapacity: 300,
      contact: '+603-4043 8920',
      facilities: ['Relief Supplies Storage', 'Baby Care Room', 'Hot Meals Supply'],
      elevationM: 36.5,
      routeStatus: 'CLEAR',
      distanceKm: 2.8,
      travelTimeMin: 8
    },
    {
      id: 'shelter-04',
      name: 'Dewan Tunku Canselor Universiti Malaya',
      category: 'University Relief Campus',
      lat: 3.1205,
      lon: 101.6575,
      address: 'Universiti Malaya, Lembah Pantai, 50603 Kuala Lumpur',
      status: 'OPEN',
      currentCapacity: 180,
      maxCapacity: 600,
      contact: '+603-7967 7022',
      facilities: ['Mass Capacity Auditorium', 'Medical Faculty Clinic', 'Emergency WiFi', 'Generator Power'],
      elevationM: 48.0,
      routeStatus: 'CLEAR',
      distanceKm: 6.8,
      travelTimeMin: 14
    },
    {
      id: 'shelter-05',
      name: 'Dewan Sivik MBPJ Petaling Jaya',
      category: 'Civic Hall',
      lat: 3.0982,
      lon: 101.6455,
      address: 'Jalan Yong Shook Lin, 46675 Petaling Jaya, Selangor',
      status: 'OPEN',
      currentCapacity: 88,
      maxCapacity: 350,
      contact: '+603-7956 3544',
      facilities: ['Full Kitchen', 'Ambulance Station', 'Pet Safe Zone', 'Power Hub'],
      elevationM: 22.0,
      routeStatus: 'CLEAR',
      distanceKm: 9.5,
      travelTimeMin: 18
    },
    {
      id: 'shelter-06',
      name: 'Stadium Melawati Shah Alam',
      category: 'Mega Indoor Stadium',
      lat: 3.0738,
      lon: 101.5183,
      address: 'Persiaran Sukan, Seksyen 13, 40100 Shah Alam, Selangor',
      status: 'FULL',
      currentCapacity: 850,
      maxCapacity: 850,
      contact: '+603-5510 4432',
      facilities: ['Regional Operations Hub', 'Mass Relief Depot - Currently Full Capacity'],
      elevationM: 18.0,
      routeStatus: 'ADVISORY',
      distanceKm: 18.5,
      travelTimeMin: 26
    }
  ];
}

export async function fetchReports(): Promise<CitizenReport[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/reports`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) return await res.json();
  } catch (e) {}

  return [
    {
      id: 'rep-01',
      title: 'Jalan Raja Muda Musa Water Spillover',
      location: 'Kampung Baru, Kuala Lumpur',
      lat: 3.1642,
      lon: 101.7031,
      waterDepthCm: 35,
      status: 'OFFICIAL_VERIFIED',
      verifiedBy: 'Huawei ModelArts PanGu-CV & APM Civil Defense',
      timestampStr: '12 min ago',
      author: 'Ahmad F.',
      upvotes: 28,
      imageUrl: '/banjir2.jpg',
      description: 'Water spilling over curbside into commercial alleyway. Depth approx 35cm, vehicles wading cautiously.',
      aiVerification: {
        verified: true,
        confidenceScore: 0.974,
        detectedHazards: ['Curbside Water Spillover', 'Commercial Lane Flooding', 'Vehicle Hydrolock Advisory'],
        estimatedDepthCm: 36,
        engine: 'Huawei ModelArts PanGu-CV (Ascend 910 NPU)',
        notes: 'PanGu-CV segmentation verified water boundary breaching road surface datum.'
      },
      humanVerification: {
        verifiedBy: 'Captain Roslan (APM Kuala Lumpur)',
        role: 'Civil Defense Officer',
        reviewedAt: '8 min ago',
        verdict: 'APPROVED',
        officialNotes: 'Confirmed by patrolling APM Unit 4. Sandbag barriers dispatched.'
      }
    },
    {
      id: 'rep-02',
      title: 'Submerged Drain & Road Clogged at Seksyen 25',
      location: 'Taman Sri Muda, Seksyen 25',
      lat: 3.0315,
      lon: 101.5360,
      waterDepthCm: 50,
      status: 'AI_VERIFIED',
      verifiedBy: 'Gemini 2.5 Flash Vision (Pending Authority Approval)',
      timestampStr: '4 min ago',
      author: 'Sarah T.',
      upvotes: 14,
      imageUrl: '/banjir3.jfif',
      description: 'Monsoon drain overflowed onto Jalan Khidmat. Wheel hubs submerged on sedan cars.',
      aiVerification: {
        verified: true,
        confidenceScore: 0.982,
        detectedHazards: ['Drain Inundation', 'Vehicle Wheel Submergence', 'Severe Hydroplaning Hazard'],
        estimatedDepthCm: 52,
        engine: 'Gemini 2.5 Flash Vision (Google AI Studio)',
        notes: 'Multimodal vision confirmed sedan car wheels submerged past 50cm threshold. Awaiting authority confirmation.'
      }
    },
    {
      id: 'rep-03',
      title: 'Sungai Rasau Underpass Water Accumulation',
      location: 'Sungai Rasau, Klang',
      lat: 3.0510,
      lon: 101.4880,
      waterDepthCm: 42,
      status: 'AI_VERIFIED',
      verifiedBy: 'Huawei ModelArts PanGu-CV (Pending Authority Approval)',
      timestampStr: 'Just now',
      author: 'Kamal R.',
      upvotes: 6,
      imageUrl: '/banjir2.jpg',
      description: 'Water ponding rapidly underneath the railway flyover. Low-clearance cars stranded.',
      aiVerification: {
        verified: true,
        confidenceScore: 0.965,
        detectedHazards: ['Underpass Ponding', 'Railway Bridge Drainage Congestion'],
        estimatedDepthCm: 44,
        engine: 'Huawei ModelArts PanGu-CV (Ascend 910 NPU)',
        notes: 'Surface water depth exceeds 40cm. Immediate hazard review recommended.'
      }
    }
  ];
}
