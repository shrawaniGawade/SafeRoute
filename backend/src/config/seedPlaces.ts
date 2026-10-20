import { CustomPlace } from '../models/CustomPlace';

export async function seedDefaultPlaces(): Promise<void> {
  try {
    const count = await CustomPlace.countDocuments();
    if (count > 0) {
      return;
    }

    const defaultPlaces = [
      {
        name: 'Saiangel Society',
        aliases: ['Sai Angel Society', 'Saiangel', 'Sai Angel', 'साई एंजेल सोसायटी'],
        category: 'residential_society',
        pinType: 'complex_gate',
        location: {
          type: 'Point',
          coordinates: [73.876243, 18.642953],
        },
        lat: 18.642953,
        lng: 73.876243,
        address: 'Saiangel Society, Sant Dnyaneshwar Marg, Near Thorala Paduka Temple, Bhosari / Dighi, Pune, Maharashtra 411039',
        locality: 'Bhosari / Dighi, Alandi Road',
        city: 'Pimpri-Chinchwad, Pune',
        state: 'Maharashtra',
        postcode: '411039',
        landmark: 'Near Thorya / Thorala Paduka Temple',
        description: 'Residential gated housing society near Thorala Paduka Temple on Alandi Road.',
        source: 'verified_partner',
        verificationStatus: 'verified',
        isPublic: true,
      },
      {
        name: 'Saiangel Society Main Entrance Gate',
        aliases: ['Saiangel Gate', 'Sai Angel Society Gate'],
        category: 'society_entrance',
        pinType: 'exact_entrance',
        location: {
          type: 'Point',
          coordinates: [73.876350, 18.642820],
        },
        lat: 18.642820,
        lng: 73.876350,
        address: 'Saiangel Society Main Gate, Internal Access Lane off Alandi Road, Bhosari, Pune, Maharashtra 411039',
        locality: 'Bhosari / Dighi',
        city: 'Pimpri-Chinchwad, Pune',
        landmark: 'Facing Thorala Paduka Temple corridor',
        description: 'Vehicle and pedestrian security gate access for Saiangel Society.',
        source: 'verified_partner',
        verificationStatus: 'verified',
        isPublic: true,
      },
      {
        name: 'Thorya / Thorala Paduka Temple',
        aliases: ['Thorala Paduka Temple', 'Thorala Paduka', 'Thorya Paduka', 'Thorlya Paduka Temple', 'थोरल्या पादुका मंदिर'],
        category: 'temple_religious',
        pinType: 'general_place',
        location: {
          type: 'Point',
          coordinates: [73.8769770, 18.6403704],
        },
        lat: 18.6403704,
        lng: 73.8769770,
        address: 'Thorya Paduka Temple, Sant Dyaneshwar Marg Flyover, Bhosari, Pimpri-Chinchwad, Pune, Maharashtra 411039',
        locality: 'Alandi Road, Bhosari',
        city: 'Pimpri-Chinchwad, Pune',
        state: 'Maharashtra',
        postcode: '411039',
        landmark: 'Sant Dnyaneshwar Marg Flyover',
        description: 'Historic Paduka temple marking the sacred Warkari Palkhi pilgrimage route between Alandi and Pandharpur.',
        source: 'verified_partner',
        verificationStatus: 'verified',
        isPublic: true,
      },
      {
        name: 'Shree Sant Dnyaneshwar Maharaj Sanjeevan Samadhi Mandir, Alandi',
        aliases: ['Alandi Mandir', 'Alandi Samadhi Mandir', 'Dnyaneshwar Samadhi Mandir', 'Sant Dnyaneshwar Mandir', 'Alandi Temple', 'श्री संत ज्ञानेश्वर महाराज समाधी मंदिर'],
        category: 'temple_religious',
        pinType: 'general_place',
        location: {
          type: 'Point',
          coordinates: [73.8964305, 18.6760109],
        },
        lat: 18.6760109,
        lng: 73.8964305,
        address: 'Shree Dnyaneshwar Maharaj Sanjeevan Samadhi Mandir, Alandi Devachi, Khed, Pune, Maharashtra 412105',
        locality: 'Alandi Devachi',
        city: 'Pune',
        state: 'Maharashtra',
        postcode: '412105',
        landmark: 'Indrayani River Ghat',
        description: 'World-renowned sacred pilgrimage shrine and 13th-century samadhi of Sant Dnyaneshwar Maharaj.',
        source: 'verified_partner',
        verificationStatus: 'verified',
        isPublic: true,
      },
      {
        name: 'Alandi Police Chowky',
        aliases: ['Alandi Police Station'],
        category: 'junction_lane',
        pinType: 'general_place',
        location: {
          type: 'Point',
          coordinates: [73.8972, 18.6755],
        },
        lat: 18.6755,
        lng: 73.8972,
        address: 'Alandi Police Chowky, Near Municipal Council, Alandi, Pune, Maharashtra 412105',
        locality: 'Alandi Town',
        city: 'Pune',
        state: 'Maharashtra',
        landmark: 'Near Alandi Bus Stand',
        source: 'verified_partner',
        verificationStatus: 'verified',
        isPublic: true,
      },
      {
        name: 'Bhosari Police Station',
        aliases: ['Bhosari Police'],
        category: 'hospital_clinic',
        pinType: 'general_place',
        location: {
          type: 'Point',
          coordinates: [73.8505, 18.6256],
        },
        lat: 18.6256,
        lng: 73.8505,
        address: 'Bhosari Police Station, MIDC Bhosari, Pimpri-Chinchwad, Pune, Maharashtra 411026',
        locality: 'Bhosari MIDC',
        city: 'Pimpri-Chinchwad, Pune',
        source: 'verified_partner',
        verificationStatus: 'verified',
        isPublic: true,
      },
    ];

    await CustomPlace.insertMany(defaultPlaces);
    console.log('[SeedPlaces] Default local landmarks and societies seeded successfully.');
  } catch (err: any) {
    console.warn('[SeedPlaces] Error seeding default places:', err?.message || err);
  }
}
